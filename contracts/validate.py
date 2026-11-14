#!/usr/bin/env python3
"""Validate a data folder against the Flame Atlas data contract.

Usage:
    python3 contracts/validate.py data/fixtures
    python3 contracts/validate.py data/processed

Checks every contract file in the folder against its JSON Schema and then runs
cross-file checks. Exit code 0 means the folder is safe for the web app to read.
Pure standard library: nothing to install.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

SCHEMA_DIR = Path(__file__).parent / "schema"
FILES = {
    "tests.json": "tests.schema.json",
    "investigations.json": "investigations.schema.json",
    "scenarios.json": "scenarios.schema.json",
    "meta.json": "meta.schema.json",
}
MAX_ERRORS_SHOWN = 40


def type_ok(value, name: str) -> bool:
    if name == "null":
        return value is None
    if name == "boolean":
        return isinstance(value, bool)
    if name == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if name == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    if name == "string":
        return isinstance(value, str)
    if name == "array":
        return isinstance(value, list)
    if name == "object":
        return isinstance(value, dict)
    raise ValueError(f"unsupported type in schema: {name}")


def check(value, schema: dict, root: dict, path: str, errors: list[str]) -> None:
    """Validate `value` against the subset of JSON Schema the contract uses."""
    if "$ref" in schema:
        target = root
        for part in schema["$ref"].lstrip("#/").split("/"):
            target = target[part]
        merged = {k: v for k, v in schema.items() if k not in ("$ref", "description")}
        check(value, target, root, path, errors)
        if merged:
            check(value, merged, root, path, errors)
        return

    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path}: {value!r} is not one of {schema['enum']}")
        return

    if "type" in schema:
        allowed = schema["type"] if isinstance(schema["type"], list) else [schema["type"]]
        if not any(type_ok(value, t) for t in allowed):
            errors.append(f"{path}: expected {' or '.join(allowed)}, got {type(value).__name__} ({value!r})")
            return

    if isinstance(value, str):
        if "pattern" in schema and not re.search(schema["pattern"], value):
            errors.append(f"{path}: {value!r} does not match {schema['pattern']}")
        if len(value) < schema.get("minLength", 0):
            errors.append(f"{path}: string is shorter than {schema['minLength']}")

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in schema and value < schema["minimum"]:
            errors.append(f"{path}: {value} is below minimum {schema['minimum']}")
        if "maximum" in schema and value > schema["maximum"]:
            errors.append(f"{path}: {value} is above maximum {schema['maximum']}")
        if "exclusiveMinimum" in schema and value <= schema["exclusiveMinimum"]:
            errors.append(f"{path}: {value} must be greater than {schema['exclusiveMinimum']}")

    if isinstance(value, list):
        if len(value) < schema.get("minItems", 0):
            errors.append(f"{path}: needs at least {schema['minItems']} item(s)")
        if "items" in schema:
            for i, item in enumerate(value):
                check(item, schema["items"], root, f"{path}[{i}]", errors)

    if isinstance(value, dict):
        props = schema.get("properties", {})
        for key in schema.get("required", []):
            if key not in value:
                errors.append(f"{path}: missing field '{key}'")
        if len(value) < schema.get("minProperties", 0):
            errors.append(f"{path}: needs at least {schema['minProperties']} key(s)")
        extra = schema.get("additionalProperties", True)
        for key, item in value.items():
            if key in props:
                check(item, props[key], root, f"{path}.{key}", errors)
            elif extra is False:
                errors.append(f"{path}: unknown field '{key}'")
            elif isinstance(extra, dict):
                check(item, extra, root, f"{path}.{key}", errors)


def pair_ok(rec: dict, lo: str, hi: str, where: str, errors: list[str]) -> None:
    a, b = rec.get(lo), rec.get(hi)
    if (a is None) != (b is None):
        errors.append(f"{where}: {lo} and {hi} must both be set or both be null")
    elif a is not None and a > b:
        errors.append(f"{where}: {lo} ({a}) is greater than {hi} ({b})")


def unique_ids(items: list, name: str, errors: list[str]) -> set:
    seen: set = set()
    for item in items:
        if not isinstance(item, dict) or "id" not in item:
            continue
        if item["id"] in seen:
            errors.append(f"{name}: duplicate id {item['id']!r}")
        seen.add(item["id"])
    return seen


def cross_checks(data: dict, errors: list[str]) -> None:
    tests = data.get("tests.json") or []
    cards = data.get("investigations.json") or []
    scenarios = data.get("scenarios.json") or []
    meta = data.get("meta.json")

    card_ids = unique_ids(cards, "investigations.json", errors)
    unique_ids(tests, "tests.json", errors)
    unique_ids(scenarios, "scenarios.json", errors)

    for t in tests:
        if not isinstance(t, dict):
            continue
        where = f"tests.json[{t.get('id', '?')}]"
        if cards and t.get("investigationId") not in card_ids:
            errors.append(f"{where}: investigationId {t.get('investigationId')!r} has no card in investigations.json")
        if isinstance(t.get("id"), str) and isinstance(t.get("investigationId"), str):
            if not t["id"].startswith(t["investigationId"] + ":"):
                errors.append(f"{where}: id must start with its investigationId")
        pair_ok(t, "o2PctMin", "o2PctMax", where, errors)
        pair_ok(t, "pressureKpaMin", "pressureKpaMax", where, errors)
        pair_ok(t, "flowCmSMin", "flowCmSMax", where, errors)
        values = t.get("o2PctValues")
        if values and t.get("o2PctMin") is not None:
            if min(values) != t["o2PctMin"] or max(values) != t["o2PctMax"]:
                errors.append(f"{where}: o2PctMin/o2PctMax must equal min/max of o2PctValues")

    for c in cards:
        if not isinstance(c, dict):
            continue
        where = f"investigations.json[{c.get('id', '?')}]"
        cond = c.get("conditions") or {}
        pair_ok(cond, "o2PctMin", "o2PctMax", where, errors)
        pair_ok(cond, "pressureKpaMin", "pressureKpaMax", where, errors)
        pair_ok(cond, "flowCmSMin", "flowCmSMax", where, errors)
        if tests and isinstance(c.get("testStats"), dict):
            actual = sum(1 for t in tests if isinstance(t, dict) and t.get("investigationId") == c.get("id"))
            if "FIXTURE" not in (c.get("review", {}).get("notes") or "") and actual != c["testStats"].get("rowCount"):
                errors.append(f"{where}: testStats.rowCount is {c['testStats'].get('rowCount')} but tests.json has {actual} rows")

    for s in scenarios:
        if isinstance(s, dict):
            pair_ok(s, "flowCmSMin", "flowCmSMax", f"scenarios.json[{s.get('id', '?')}]", errors)

    if isinstance(meta, dict) and isinstance(meta.get("counts"), dict):
        counts = meta["counts"]
        if tests and counts.get("rows") != len(tests):
            errors.append(f"meta.json: counts.rows is {counts.get('rows')} but tests.json has {len(tests)} records")
        if cards and counts.get("investigations") != len(cards):
            errors.append(f"meta.json: counts.investigations is {counts.get('investigations')} but there are {len(cards)} cards")
        if isinstance(meta.get("tables"), list) and counts.get("tables") != len(meta["tables"]):
            errors.append("meta.json: counts.tables does not match the length of tables")
        q = meta.get("quality") or {}
        if q.get("checkedValues") is not None and q.get("correctValues") is not None:
            if q["correctValues"] > q["checkedValues"]:
                errors.append("meta.json: quality.correctValues is greater than quality.checkedValues")


def main() -> int:
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    folder = Path(sys.argv[1])
    if not folder.is_dir():
        print(f"Not a folder: {folder}")
        return 2

    errors: list[str] = []
    data: dict = {}
    for name, schema_name in FILES.items():
        path = folder / name
        if not path.exists():
            errors.append(f"{name}: file is missing in {folder}")
            continue
        try:
            value = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            errors.append(f"{name}: not valid JSON ({exc})")
            continue
        schema = json.loads((SCHEMA_DIR / schema_name).read_text(encoding="utf-8"))
        check(value, schema, schema, name, errors)
        data[name] = value
        size = len(value) if isinstance(value, list) else 1
        print(f"  read {name}: {size} record(s)")

    cross_checks(data, errors)

    if errors:
        print(f"\nFAILED: {len(errors)} problem(s) in {folder}")
        for line in errors[:MAX_ERRORS_SHOWN]:
            print("  - " + line)
        if len(errors) > MAX_ERRORS_SHOWN:
            print(f"  ... and {len(errors) - MAX_ERRORS_SHOWN} more")
        return 1
    print(f"\nOK: {folder} matches the data contract")
    return 0


if __name__ == "__main__":
    sys.exit(main())
