# Контракти: типи даних, файли, API

Версія **v0** (субота, старт). Власник — роль A. Перша задача A: перенести ці типи в zod-схеми
`packages/contracts` і перевірити ними фікстури з `data/fixtures`.

Зміна контракту: абзац у чат команди → A погоджує → правка тут і в `packages/contracts` →
рядок у `docs/decisions.md`. Після контрольної точки 1 (субота 18:30) контракт **v1** заморожено:
далі можна лише додавати необов'язкові поля.

## 1. Спільні типи

```ts
type InvestigationId = `PSI-${number}`;                 // "PSI-25"
type Pillar = 'prevention' | 'detection' | 'suppression' | 'fundamentals';
type FuelState = 'solid' | 'liquid' | 'gas' | 'aerosol';
type Gravity = 'micro' | 'normal' | 'partial-simulated';
type FlowDirection = 'opposed' | 'concurrent' | 'coflow' | 'quiescent' | 'unknown';
type Confidence = 'high' | 'medium' | 'low';
type Granularity = 'test' | 'test-day' | 'matrix-row' | 'reference';

/**
 * Число з джерела. У таблицях PSI трапляються одиничні значення ("22.2"),
 * діапазони ("21.5 - 21.7"), переліки ("21; 26.5; 40") і наближення ("~ 21.5").
 * Для одиничного значення min === max. Одиниця виміру задана назвою поля (o2Pct, pressureKpa).
 */
interface Num {
  min: number | null;
  max: number | null;
  values?: number[];      // якщо в джерелі перелік
  approx?: boolean;       // "~", "approx"
  raw: string;            // як у джерелі, разом з одиницями
}

interface Citation {
  sourceId: string;       // id з sources.json, напр. "PSI-25/summary-report"
  locator?: string;       // "p.12" | "row 14" | "col: Percent O2"
  quote?: string;         // дослівно, до 25 слів; перевіряється програмно
}

/** Твердження з джерелом. citations.length >= 1 завжди. */
interface Claim {
  text: string;
  citations: Citation[];
}
```

## 2. Investigation — картка дослідження

Файл `data/processed/investigations.json`: масив `Investigation[]` (24 записи).

```ts
interface Investigation {
  id: InvestigationId;
  acronym: string | null;            // "BASS-II"; у наземних аналізів буває null
  title: string;
  doi: string | null;
  psiUrl: string;
  kind: 'flight' | 'ground';
  platform: string | null;           // "ISS", "Cygnus"
  facility: string | null;           // "MSG", "CIR"
  insert: string | null;             // "ACME", "MDCA", "SPICE flow duct"
  years: { start: number | null; end: number | null };

  pillars: { primary: Pillar; secondary: Pillar[] };
  fuelStates: FuelState[];
  fuels: { name: string; state: FuelState; geometry: string | null }[];

  /** Агрегати з tests.json і документів. null = невідомо. */
  conditions: {
    o2Pct: Num | null;
    pressureKpa: Num | null;
    flowCmS: Num | null;
    diluents: string[];              // "N2", "CO2", "He"
    gravity: Gravity[];
  };

  summary: Claim;                    // 2-3 речення
  objectives: Claim[];
  measurements: { quantity: string; instrument: string | null; citations: Citation[] }[];
  keyFindings: Claim[];
  fireSafetyRelevance: Claim[];      // як результати стосуються безпеки екіпажу
  earthApplications: Claim[];        // може бути порожнім
  related: { id: InvestigationId; relation: string }[];

  testStats: { tableFiles: string[]; rowCount: number; granularity: Granularity[] };
  publications: Publication[];
  documents: string[];               // sourceId з sources.json

  review: {
    status: 'unreviewed' | 'spot-checked' | 'reviewed';
    by: string | null;
    notes: string | null;
  };
}

interface Publication {
  title: string;
  year: number | null;
  authors: string | null;
  doi: string | null;
  venue: string | null;
  abstract: string | null;           // з OpenAlex / Crossref, якщо є
  openAccessUrl: string | null;
}
```

## 3. TestRecord — єдина таблиця тестів

Файл `data/processed/tests.json`: масив `TestRecord[]` (орієнтовно 2 800 записів з 22 таблиць).
Усі нормалізовані поля можуть бути `null`. Поле `raw` заповнене завжди.

```ts
interface TestRecord {
  id: string;                        // "PSI-25:BASS-II:B1" = дослідження:таблиця:мітка або номер рядка
  investigationId: InvestigationId;
  tableFile: string;                 // "PSI-25_Experimental table_BASS-II.csv"
  sourceRow: number;                 // номер рядка даних у CSV, з 1
  granularity: Granularity;          // 'test' = один запуск; 'test-day' = підсумок дня;
                                     // 'matrix-row' = рядок матриці умов; 'reference' = посилання на рисунок статті
  label: string | null;              // мітка тесту з джерела
  date: string | null;               // ISO, якщо вдалося розібрати

  fuel: {
    name: string | null;             // "PMMA", "Methanol", "C2H4"
    state: FuelState | null;
    geometry: string | null;         // "film", "sphere", "droplet", "rod", "fabric sheet", "burner"
    thicknessMm: Num | null;
    widthMm: Num | null;
    diameterMm: Num | null;
    raw: string | null;              // "100 micron PMMA film   2 cm wide"
  };

  atmosphere: {
    o2Pct: Num | null;               // початкова частка O2, % об.
    o2PctFinal: Num | null;
    diluent: string | null;          // "N2", "CO2", "He"
    pressureKpa: Num | null;
    co2Pct: Num | null;
  };

  flow: { speedCmS: Num | null; direction: FlowDirection };
  gravity: Gravity;

  outcome: {
    ignited: boolean | null;
    end: 'self-extinguished' | 'flow-terminated' | 'burned-out' | 'blowoff'
       | 'disruption' | 'not-ignited' | 'other' | null;
    burnTimeS: Num | null;
    spreadRateMmS: Num | null;
    coolFlame: boolean | null;
    notes: string | null;
  };

  raw: Record<string, string>;       // усі вихідні колонки без змін

  norm: {
    mappingVersion: string;          // версія маппінгу таблиці
    confidence: Confidence;
    inferred: string[];              // шляхи полів, виведених не напряму з колонки,
                                     // напр. "atmosphere.pressureKpa" з ReadMe
  };
}
```

Внутрішній формат ролі A (не читається застосунком): `pipeline/src/normalize/mappings/<table>.json`.

```ts
interface TableMapping {
  investigationId: InvestigationId;
  tableFile: string;
  version: string;
  granularity: Granularity;
  defaults: { path: string; value: unknown; citation: Citation }[];   // напр. gravity = 'micro'
  columns: Record<string, {
    target: string | null;           // шлях у TestRecord або null (лишається тільки в raw)
    transform?: 'number' | 'quantity' | 'fraction-to-pct' | 'mmHg-to-kPa' | 'atm-to-kPa'
              | 'bar-to-kPa' | 'psi-to-kPa' | 'enum' | 'fuel-string' | 'date';
    enumMap?: Record<string, string>;
    note?: string;
  }>;
  tableNotes: string[];              // виноски таблиці (в ACME-таблицях вони лежать у колонці Notes)
}
```

## 4. Джерела й фрагменти

```ts
// data/processed/sources.json
interface SourceDoc {
  id: string;                        // "PSI-25/summary-report"
  investigationId: InvestigationId | null;   // null для загальних джерел (Researcher's Guide)
  name: string;                      // назва файлу або документа
  kind: 'psi-metadata' | 'experimental-table' | 'readme' | 'srd' | 'test-matrix'
      | 'summary-report' | 'final-report' | 'publication-abstract' | 'guide' | 'other';
  url: string;                       // публічне посилання (сторінка PSI, DOI, nasa.gov)
  sizeMb: number | null;
  pages: number | null;
  parsed: boolean;
}

// data/processed/chunks.json
interface Chunk {
  id: string;                        // "PSI-25/summary-report#p12-0"
  sourceId: string;
  investigationId: InvestigationId | null;
  locator: string;                   // "p.12"
  text: string;
}
```

## 5. Scenario — середовище користувача

Файл `data/processed/scenarios.json`: пресети. Зміст готує роль E, числа мають джерело.

```ts
interface Scenario {
  id: string;                        // "iss" | "lunar-habitat" | "mars-habitat" | "rover" | "eva-suit" | "custom"
  name: string;
  description: string;
  o2Pct: number;
  pressureKpa: number;
  gravityG: number;                  // 0 для мікрогравітації, 0.165 Місяць, 0.38 Марс, 1 Земля
  flowCmS: { min: number; max: number } | null;
  fuelStates: FuelState[];           // які матеріали турбують
  focus: Pillar | 'all';
  sources: Citation[];               // звідки числа пресету
  assumptions: string[];             // що в пресеті є припущенням
}
```

## 6. Ранжування, покриття, прогалини (`packages/core`)

```ts
interface RankWeights {              // сума = 1; значення за замовчуванням у core/config
  o2: number; pressure: number; flow: number; fuel: number;
  pillar: number; gravity: number; data: number;
}

interface RankItem {
  investigationId: InvestigationId;
  score: number;                     // 0..100
  components: Record<keyof RankWeights, number>;   // кожна 0..1
  matchedTests: string[];            // id найближчих тестів, до 5
  caveats: string[];                 // "pressure unknown for this investigation"
  rationale: Claim | null;           // текст від LLM, додається окремо (/api/explain)
}

interface RankResult { scenario: Scenario; weights: RankWeights; items: RankItem[] }

interface CoverageCell {
  x: { min: number; max: number };   // напр. O2, крок 5%
  y: { min: number; max: number };   // тиск або потік
  count: number;
  byFuelState: Partial<Record<FuelState, number>>;
  investigationIds: InvestigationId[];
}

interface CoverageGrid {
  xField: 'o2Pct';
  yField: 'pressureKpa' | 'flowCmS';
  cells: CoverageCell[];
  unknownY: number;                  // скільки тестів без значення по осі Y
}

interface CompareMatrix {            // форму рядків C узгоджує з D
  investigationIds: InvestigationId[];
  rows: {
    attribute: string;               // "Facility", "Fuel", "O2 range, %", "Measurements"
    values: (string | null)[];       // по одному значенню на дослідження, у порядку investigationIds
    differs: boolean;                // true, якщо значення різняться
  }[];
}

interface Gap {                      // рахується кодом, не LLM
  statement: string;                 // "No solid-fuel tests above 30% O2 below 70 kPa"
  scenarioId: string | null;
  evidence: { testCount: number; nearestTests: string[] };
}
```

Функції `core`, на які спирається інтерфейс:

```ts
rankInvestigations(scenario, investigations, tests, weights?): RankResult
nearestTests(scenario, tests, k): TestRecord[]
coverageGrid(tests, { yField, fuelState?, gravity? }): CoverageGrid
findGaps(scenario, tests, investigations): Gap[]
compareInvestigations(ids, investigations, tests): CompareMatrix
filterTests(tests, filters): TestRecord[]
toCsv(tests): string                 // експорт з колонками provenance
```

## 7. API (`apps/web/app/api`)

Дані малі, тому сторінки можуть імпортувати JSON і викликати `core` напряму.
Маршрути потрібні для LLM, експорту й зовнішнього доступу.

| Метод і шлях | Власник | Вхід | Вихід |
|---|---|---|---|
| `GET /api/investigations` | C | — | `Investigation[]` (скорочені поля) |
| `GET /api/investigations/[id]` | C | — | `Investigation` |
| `GET /api/tests` | C | фільтри в query | `TestRecord[]` |
| `POST /api/rank` | C | `{ scenario: Scenario, weights? }` | `RankResult` |
| `GET /api/coverage` | C | `yField`, `fuelState?` | `CoverageGrid` |
| `GET /api/export` | C | фільтри, `format=csv\|json` | файл |
| `POST /api/explain` | A | `{ scenario, investigationId }` | `{ rationale: Claim }` |
| `POST /api/ask` | A | `{ question, scenario? }` | `AskResponse` (потік) |

```ts
interface AskResponse {
  answerMd: string;                  // маркери джерел [1], [2] у тексті
  citations: (Citation & { n: number; investigationId: InvestigationId | null;
                           docName: string; url: string })[];
  investigationsUsed: InvestigationId[];
  notFound: boolean;                 // true, якщо в даних PSI відповіді немає
}
```

## 8. Файли в `data/processed`

| Файл | Хто пише | Хто читає |
|---|---|---|
| `investigations.json` | A (cards) + B (publications) | C, D |
| `tests.json` | A (normalize) | C, D |
| `sources.json`, `chunks.json`, `search-index.json` | B | A (`ask`), D (посилання) |
| `scenarios.json` | E (зміст) → C (файл) | C, D |
| `eval.json` | A + E | D (сторінка Methodology) |

Фікстури з тими самими формами лежать у `data/fixtures`.
