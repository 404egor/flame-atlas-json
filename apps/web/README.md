# Flame Atlas — web app

Static Next.js site for the Flame Atlas project. It reads four prepared JSON files and computes
everything in the browser. There is no server, database or AI call at runtime.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit tests for src/domain
npm run lint
npm run build      # static export into out/
```

Node 20.19 or newer is required.

## Where the data comes from

`scripts/sync-data.mjs` runs before `dev`, `build` and `test`. It copies the four contract files and
`contracts/types.ts` into `src/generated/` (not committed).

- It uses `data/processed` when that folder has all four files, otherwise `data/fixtures`.
- `DATA_SOURCE=fixtures npm run dev` forces the sample data.
- The site shows a banner while it runs on sample data.

The data format is defined in [`contracts/README.md`](../../contracts/README.md).

## Layout

```
src/
  app/          routes; each file only mounts one feature
  features/     one folder per screen: scenario, tests, coverage, investigations, methodology
  components/   shared presentational components
  domain/       pure functions and the single config of numbers; unit-tested
  lib/          data gateway, paths, pillar colours, theme, url-state/ (the scenario in the address)
  generated/    copied in by sync-data, do not edit
```

The rules that keep two people building in parallel consistent are in the architecture spine:
[`ARCHITECTURE-SPINE.md`](../../_bmad-output/planning-artifacts/architecture/architecture-flame-atlas-2026-11-14/ARCHITECTURE-SPINE.md).
The short version:

- Calculations live in `src/domain` as pure, tested functions. Components do not compute.
- Only `src/lib/data.ts` imports JSON. Contract types come only from `@/generated/contract`.
- Every number the site reasons with lives in `src/domain/config.ts`.
- A "test" is a row with `granularity === "test"`; use `isTestRow`.
- `null` is shown as "not reported" through `src/domain/format.ts`, never as zero.
- A feature folder does not import another feature folder.
- No server features: the site is a static export (`output: "export"`). The `searchParams` page prop is one of them: read the query string in client components only.
- Whether a row falls in an interval is decided only by `rangeMatchesInterval` in `src/domain/num.ts`, so a grid cell, a filter and a headline count always agree.
- Shapes of domain inputs and results are fixed in `src/domain/types.ts` before the code that uses them.
- The chosen environment is read from the address with `parseScenario` (`src/lib/url-state/scenario.ts`). Change the address with `window.history.replaceState` and a relative `?query`; `usePathname()` does not include the base path.
- If a real chart is needed: `npm i recharts@3.10.1 react-is@19.3.0`, both together. With the old `react-is` Recharts silently drops elements under React 19.
- Colours come only from the tokens in `src/app/globals.css` (`bg-surface`, `text-fg-muted`, `border-line` and so on), never from palette classes such as `bg-white` or `text-slate-600`. Each token has a light and a dark value, so a component written with tokens works in both themes. The one exception is `src/lib/pillars.ts`, where every palette class has a `dark:` pair.

## Light and dark theme

The theme is the `data-theme` attribute on `<html>`. A choice made with the toggle in the header is
saved in `localStorage` under `theme`; without a saved choice the site follows the operating system.
A small script in `<head>` sets the attribute before the first paint, so the static page does not
flash the wrong theme. All of this lives in `src/lib/theme.ts`.

To add a colour, add a token with both values in `globals.css` and expose it in the `@theme` block.

## Deployment

`.github/workflows/site.yml` builds the site and publishes `out/` to GitHub Pages on every push to
`main`. The base path comes from `NEXT_PUBLIC_BASE_PATH`, which CI sets to `/<repository name>`.
Local development serves from the root.
