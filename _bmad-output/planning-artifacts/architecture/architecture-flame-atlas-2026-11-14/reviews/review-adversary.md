# Adversarial review — ARCHITECTURE-SPINE.md (Flame Atlas, apps/web)

Reviewed: 2026-11-14. Lens: find pairs of units that each obey every AD to the letter and still do not fit together.

Read: the spine, `contracts/README.md`, `contracts/types.ts`, `tracks/product.md`, `docs/01-product-spec.md`, `docs/02-architecture.md` section 5, `data/fixtures/*`. The PR-1 scaffolding in `apps/web/src` was being written while I reviewed; where I cite it, it is evidence of how a rule is already being interpreted, as of review time.

## Verdict

The spine fixes the layering, the data gateway, the base path and the "what is a test" rule well enough that two builders will not collide there. It does not yet fix the three places where the screens actually touch each other: how a row is matched to an interval, the scenario as state shared by two screens, and the shapes of the domain results both people consume. Each of those can produce two correct-by-the-spine halves that disagree on a number or do not compile together. Eight findings, three of them worth fixing before parallel work starts; all fixes are one or two sentences.

## Findings

### F1 (high) — No single rule for "this row falls in this interval"

**Pair:** `domain/filters` (Tests, PR-5) and `domain/coverage` + `domain/gaps` (Coverage, PR-6; reused by the Scenario finding, PR-9).

**Why both obey the spine:** AD-3 only says each calculation is a pure function in `domain`; AD-4 only says the numbers live in `config.ts`. Neither says that the range filter, the grid cell assignment and the atmosphere class are the same rule.

**What breaks:** the three already differ in the code written under these ADs.

- `domain/num.ts`: `inRange` and `rangesOverlap` use closed bounds and ignore `o2PctValues`; `distanceToRange` is list-aware.
- `domain/config.ts`: grid cells are half-open (`edge[i] <= v < edge[i+1]`), and PR-6 says a row with a list counts in the cell of each listed value.
- `COVERAGE_BINS.pressureKpa` is `0, 30, 60, 90, 110…`, so the class threshold 70.3 kPa sits inside the 60–90 cell.

Consequences: a row with O2 `21; 26.5; 40` is absent from the 30–35 cell, but a filter `O2 30–35` built on `rangesOverlap` returns it. A test at exactly 35 % is in cell 35–40 but in filter 30–35. So the click "cell → Tests" (PR-6) shows a different count than the cell, on the cell the Lunar habitat demo clicks. The headline number (solid tests at O2 ≥ 30 % and pressure ≤ 70.3 kPa) cannot be read off the grid, and nothing makes it equal the Tests filter or the DA-14 number it must match.

**Smallest fix:** new AD-11: one predicate in `domain/num.ts` decides whether a row falls in an interval (any listed value if a list exists, else the min–max span; one stated boundary side per axis, O2 lower-inclusive, pressure and flow upper-inclusive), and `filters`, `coverage`, `gaps` and the atmosphere class call nothing else. Tighten AD-4: the grid edges contain every threshold in config (30 %, 70.3 kPa), and a vitest asserts for every cell that its count equals `applyFilters(tests, filtersForCell(cell)).length`. Send the same sentence to the DA-14 owner.

### F2 (high) — The scenario is state shared by two screens, but AD-7 only knows per-screen state

**Pair:** `features/scenario` (PR-4, PR-9) and `features/coverage` (PR-6: "current scenario marker", `findGaps(scenario, tests)`); also `domain/rank` and `domain/gaps`.

**Why both obey the spine:** AD-7 asks for "a parse/build pair for each screen". Coverage's pair may encode the scenario its own way, pick its own default, and nothing says how the scenario gets from `/` to `/coverage/` (the nav links are plain hrefs).

**What breaks:**

- The demo path "Lunar habitat → Coverage shows the void near the base" lands on a Coverage page with no scenario, or with a different default.
- Demo scenario 2 in the product spec is ISS with focus `detection`, but the preset `iss` has focus `all`, so its direct link needs an override encoding. Custom values are third on the cut list, so this has to be decided now.
- The contract `Scenario` has `id`, `name`, `sources`; a custom scenario has none. `rankInvestigations` and `findGaps` will be typed against different inputs.
- "Materials" (PR-4 form, PR-6 gap 1) is read as `fuelStates` by one person and as fuel names by the other.

**Smallest fix:** tighten AD-7: the scenario is one URL slice (`scenario=<preset id>` plus optional override params) with a single parse/build pair used by every screen that needs it; absent means `DEFAULT_SCENARIO_ID` from config; cross-screen links are built by `coverageHref(scenario)` and `testsHref(filters)`, and the top nav carries no state. Domain functions take `ScenarioInput` (the seven numeric and enum fields of `Scenario`, exported from `domain`), so "materials" means `fuelStates`.

### F3 (high) — Shared domain results have names but no shapes, and two of them have two natural owners

**Pair:** `domain/rank` (PR-3) and `features/scenario` (PR-4), built in parallel by design; `domain/rank` and `domain/gaps`; `features/coverage` and `features/scenario`.

**Why both obey the spine:** the spine lists module names only. AD-3 forbids "two implementations of one formula" but does not say which things are one formula.

**What breaks:**

- PR-4 builds score bars against a guessed result shape (components as array or record, caveats as text or codes, nearest tests as records or ids) and meets PR-3 at merge.
- "Three nearest tests" (rank) and "the nearest test" (gaps, finding block) get two distance functions, so the Scenario screen can name two different nearest tests. Scenario-side gaps are also undecided: the EVA preset has no flow, and scenario flow is a range, not a point.
- The gap list is rendered in Coverage and again on Scenario (AD-10 forbids the import), so the headline sentence is worded twice.

**Smallest fix:** new AD-12, signature-first: before two people build against a domain module, its exported types and function stubs are on `main` (`rankInvestigations → RankedInvestigation[]`, `findGaps → Gap[]`, `buildCoverageGrid → CoverageGrid`, `applyFilters(tests, TestFilters)`, `summarizeVariables`, `toCsv`); changing an exported type is its own commit, announced in chat. Tighten AD-3: the test-to-scenario distance and the gap sentence (`describeGap`) each exist once in `domain` and are imported by `rank`, `gaps` and both screens.

### F4 (medium) — AD-7 and AD-10 pull against each other on `url-state.ts`

**Pair:** any two screens built in parallel in step 2.

**What breaks:** AD-7 puts every screen's parameter code in one file; AD-10 exists to prevent merge conflicts. Two people appending 50 lines each to the same file conflict every time. AD-7 also says only `url-state.ts` reads and writes the query string while describing pure parse/build functions, so who calls `useSearchParams` and the router is open: one screen uses `router.push`, another `router.replace` without `scroll: false` and jumps to the top on every filter change.

**Smallest fix:** tighten AD-7: `src/lib/url-state/` is a folder with one file per screen plus one hook `useQueryState(parse, build)`; `useSearchParams`, `useRouter` for state and parameter names appear nowhere else (checkable with grep), and the hook always calls `router.replace(href, { scroll: false })`. Arrays are comma-separated, default values are omitted, invalid values fall back to the default.

### F5 (medium) — AD-8 cannot be built as written

**Pair:** `features/scenario` (nearest tests) and `features/tests` (table), both needing `<SourceValue>`, which does not exist yet and has no owner or props.

**What breaks:** the contract has no mapping from a normalized field to the raw column it came from, only the whole `raw` row and the `inferred` list. One builder shows the whole source row; the other picks a raw column by name, which is a guess the project forbids. In the Tests table the letter of AD-8 means 600 popovers per page, where PR-5 asks for a row expansion. The last sentence ("text from data is not shown past these two components") is already broken by necessity: titles, scenario `description` and `assumptions`, `meta.dataNotes`, publications and the footer's `meta.source.name` are neither a `Claim` nor a row value. One person will wrap them in fake claims, the other will print them.

**Smallest fix:** tighten AD-8: `<SourceValue row field>` renders the `format.ts` text of that field, marks it when the field is in `row.inferred`, and opens the whole source row (`raw`, `tableFile`, `sourceRow`); the site never guesses a raw column, and in the Tests table the row expansion is that access. Narrow the last sentence to `Claim` objects and `TestRecord` fields; scenario `sources` use the citation list of `<ClaimText>`, other strings are plain text.

### F6 (medium) — The spine and the documents agents are told to read give opposite literal instructions

`CLAUDE.md` sends every agent to `tracks/product.md`. Four deltas:

| Topic | `tracks/product.md` / `docs/02-architecture.md` | Spine |
| --- | --- | --- |
| Gateway path | `apps/web/lib/data.ts` | `src/lib/data.ts` |
| Contract types | imported from `contracts/types.ts` | only from `@/generated/contract` (AD-2) |
| Base path | `basePath: '/flame-atlas'` in the config | only in `NEXT_PUBLIC_BASE_PATH` set by CI (AD-9) |
| Switch to real data | "switch `lib/data.ts` to `data/processed`" after step 1 | automatic in `sync-data.mjs`; `data.ts` never changes |

An agent that follows the track "fixes" the code away from the spine. Also the Stack table says Vitest 5.1.0; `package.json` has 4.1.12 (5.x needs Node 22), and an agent may "correct" it back.

**Smallest fix:** one line under the spine header: for `apps/web` this spine overrides `tracks/product.md` and `docs/02-architecture.md` where they differ, followed by the four deltas; set Vitest to 4.1.12 in the Stack table.

### F7 (low) — shadcn/ui "as needed" has two owners

The conventions say shadcn components are added through the CLI when needed, and that dependencies are added by the owner of `main`. The CLI rewrites `globals.css`, adds packages and creates `components.json`; shadcn is not initialized yet and Recharts is not installed. Two branches that each run it conflict on `package-lock.json` and `globals.css`, and the screens split between shadcn tokens and the raw `slate-*` classes already in `components/`.

**Smallest fix:** the owner of `main` runs `shadcn init`, adds the agreed component set and Recharts in PR-1; nobody else runs the CLI or installs a package.

### F8 (low) — Most rules have no check, and the layer table forbids what AD-2 requires

AD-1 says the build passes before every merge, but there is no workflow yet and nothing runs lint or vitest. AD-2, AD-3 and AD-10 are import rules that an agent breaks silently. The layer table lets `features` and `components` import only `domain`, `components`, `lib`, while AD-2 makes `@/generated/contract` the only source of contract types; `components/claim-text.tsx` already imports it.

**Smallest fix:** make `npm run check` (`lint && typecheck && test && build`) the pre-merge gate in AD-1 and the first step of the Pages workflow, with one `no-restricted-imports` block covering AD-2, AD-3 and AD-10. Add "types from `generated`" to the `app`, `features` and `components` rows of the layer table.

## Does each AD prevent what it says?

| AD | Enforceable today | Prevents its stated divergence |
| --- | --- | --- |
| AD-1 static export | yes, by the build; no gate yet (F8) | yes |
| AD-2 data gateway | partly (grep for `.json` imports) | yes; layer table contradicts it (F8) |
| AD-3 calculations in domain | by review only | no: "one formula" is undefined across modules (F1, F3) |
| AD-4 one source of numbers | by review only | partly: numbers are in one file but not tied to each other (F1) |
| AD-5 what counts as a test | yes, `isTestRow` and `countRows` exist | yes; "empty cell" still needs "zero `test` rows" |
| AD-6 missing value | partly | yes on screen; wrong for export (see nits) |
| AD-7 state in URL | no: who touches the router is undefined | no for shared state and cross-screen links (F2, F4) |
| AD-8 traceability | no: component undefined, last sentence too broad | no (F5) |
| AD-9 base path | yes, verified by build per the memlog | yes |
| AD-10 feature owns its screen | by review only | partly: the shared files it names are the conflict points (F4) |

## Deferred items: can any of them split the builders now?

- **Loading data from `public/` instead of the bundle.** Low risk at this size, but nobody is named to measure, and every feature imports synchronous constants from `lib/data.ts`. Add: the owner of `main` measures the shared chunk at the step-1 check; route files pass only route params, features read data themselves.
- **Table virtualization, "50 rows per page".** A number outside `config.ts`; add the page size to AD-4's list.
- **Dark theme.** `globals.css` already pins light; add "no `dark:` classes" to the conventions so the pin holds.
- **Live Evidence brief, Compare, end-to-end tests, GitHub Pages switch.** No divergence.

## Nits (one line each)

- AD-6 binds export too: say that CSV writes an empty cell and JSON writes `null`; `not reported` is display text only, otherwise numeric columns become text in Excel and pandas.
- AD-6: state what the code already claims, that every value-to-text conversion goes through `domain/format.ts`, and put display labels of contract enums (granularity, gravity, outcome, flow direction) there in one map.
- AD-6: say whether `include not reported` is one switch or one per field; it belongs in `TestFilters`.
- AD-4: add gravity levels (0, 0.165, 0.38, 1), the "near the scenario" threshold and the default scenario id to the listed contents.
- AD-3: "every domain file has a test" should exempt `config.ts`.
- Structural seed: add `domain/rows`; `lib/paths.ts` already holds `ROUTES` and `investigationHref`, so name it as the home of route paths.
- `lib/pillars.ts` holds Tailwind classes only; Recharts will need a hex value per pillar in the same map.

## Checked and found sound

AD-1 against the real `next.config.ts`; AD-2 gateway and the sync script (the fixtures banner makes the active source visible); AD-5; AD-9; the import direction of the layer diagram apart from the type-import gap in F8; consistency of AD-4, AD-5, AD-6 with the contract's "what the files do not contain" section and with the ranking formula in `docs/02-architecture.md`.
