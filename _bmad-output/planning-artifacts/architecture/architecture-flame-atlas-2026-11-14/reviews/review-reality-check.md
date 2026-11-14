# Reality-check review: Architecture Spine, Flame Atlas site (apps/web)

Reviewed: `ARCHITECTURE-SPINE.md` (status: draft, 2026-11-14)
Reviewer lens: was each committed decision checked against reality, or asserted from memory?
Date of review: 2026-11-14, 17:15-17:30 EET. `apps/web` was being edited by someone else during the review
(`package.json`, `scripts/`, `vitest.config.mts`, `.github/workflows/site.yml` appeared while I was reading). Where
the spine and the tree disagree, I say so.

## Verdict

The spine is sound and mostly reality-checked: the Next.js rules (AD-1, AD-7, AD-9) match the bundled 16.4.6 docs
and source, and the deployment plan works. Two Stack rows are wrong or incomplete (Vitest 5.1.0, the Node minimum),
one dependency has a verified silent-failure trap (Recharts with `react-is`), and AD-1 and AD-7 each miss one thing
a developer will reach for today (`searchParams` page prop; how to write the URL).

## How I checked

- Bundled docs: `apps/web/node_modules/next/dist/docs/` (paths below are relative to it).
- Next.js source in `apps/web/node_modules/next/dist/` where the docs are silent.
- Installed versions from `node_modules/*/package.json`; registry via `npm view`.
- Two dependency resolutions run on a copy of `package.json` + `package-lock.json` in a scratch folder with
  `--package-lock-only` (nothing installed, project untouched).
- Read-only local runs: `tsc --noEmit --incremental false` on the app, a `react-is` probe with the installed React.
- Outside facts: the `nextjs/deploy-github-pages` workflow (the template the bundled docs point to), the READMEs and
  `action.yml` of `actions/upload-pages-artifact` and `actions/configure-pages`, Node's `schedule.json`, one `curl -I`
  against a GitHub Pages site, `gh repo view`.

Not done: I did not run `next build` or `vitest` on the current tree (both write files, and the tree was changing).

## Findings, most important first

| # | Severity | Where | Problem | Correct statement |
|---|---|---|---|---|
| 1 | Wrong | Stack: Vitest 5.1.0 | Exists, but cannot be used with Node 20.20 and `@types/node ^20`. The app actually has 4.1.12. | Vitest 4.1.12 (pulls Vite 8.3.8). |
| 2 | Trap, verified | Stack: Recharts 3.10.1 | `npm i recharts` reuses the hoisted `react-is` 16.13.1, which does not recognise React 19 elements. | Install `recharts@3.10.1 react-is@19.3.0` together; list `react-is` in the Stack. |
| 3 | Missing | AD-1 | The `searchParams` prop of `page.tsx` is not in the forbidden list, and it fails the export build. | Add it; the query string is read only in client components. |
| 4 | Missing | AD-7 | The rule says who reads and writes the query string but not how to write it without a server. | `window.history.replaceState` / `pushState` with a relative `?query`, inside `url-state.ts` only. |
| 5 | Inaccurate | Stack: Node "≥ 20.9" | 20.9 is the Next.js minimum only. Vite 8.3.8 needs ≥ 20.19. Node 20 has been end-of-life since 2026-04-30. | "20.20.0 (toolchain needs ≥ 20.19)". |
| 6 | Imprecise | AD-1 | "Route handlers" are not wholly unsupported; config `headers` is missing from the list. | See AD-1 section. Fine to keep the stricter project rule. |
| 7 | Catch | AD-9 | `generateStaticParams` returning `[]` fails the export build; `params` is a Promise. | See AD-9 section. |
| 8 | Catch | AD-2 | Data crossing the server-to-client boundary as props is duplicated into every page's HTML. | Client components import from `@/lib/data`; route files pass ids or one record. |

### 1. Vitest 5.1.0 is not installable in this project

- Registry: `npm view vitest version` gives 5.1.0 (published 2026-11-02), so the version exists.
- `npm view vitest@5.1.0 engines`: `node: ^22.12.0 || ^24.0.0 || >=26.0.0`. Node 20.20.0 is excluded.
- Scratch resolution of `npm install -D vitest@5.1.0` against the app's `package.json`: `npm error code ERESOLVE`,
  `peerOptional @types/node@"^22.0.0 || >=24.0.0" from vitest@5.1.0` conflicts with the root `@types/node@"^20"`.
- What is installed now: `vitest` 4.1.12 (`engines: ^20.0.0 || ^22.0.0 || >=24.0.0`) with `vite` 8.3.8.
  `package.json` says `"vitest": "^4.1.12"`.

Correction: change the Stack row to **Vitest 4.1.12 (Vite 8.3.8)**. The alternative, moving to Node 22 or 24 with
`@types/node` to match, is not worth doing the day before the deadline.

### 2. Recharts 3.10.1 will silently run on `react-is` 16

- Registry: 3.10.1 is the latest; peers `react`, `react-dom`, `react-is` all accept `^19.0.0`; `engines: node >=18`.
  It is not installed yet.
- `react-is` 16.13.1 is already hoisted in `node_modules` (`eslint-config-next` → `eslint-plugin-react` →
  `prop-types`). It satisfies Recharts' peer range `^16.8.0 || ... || ^19.0.0`.
- Scratch resolution of `npm install recharts@3.10.1`: the lockfile keeps `node_modules/react-is` at 16.13.1 and
  adds no 19.x.
- Local probe with the installed packages: React 19.3.0 elements have `$$typeof = Symbol(react.transitional.element)`;
  `require('react-is').isFragment(<Fragment>)` returns `false` (and `isElement` returns `false`).
- Recharts 3.10.1 `lib/util/ReactUtils.js` calls `isFragment` in `toArray`, which `findAllByType` uses. Chart
  children wrapped in a fragment (for example a helper that returns `<>{cells}</>`) are then not found, with no error.

Correction: `npm i recharts@3.10.1 react-is@19.3.0`, add `react-is 19.3.0` to the Stack table, and confirm with
`npm ls react-is` that Recharts resolves to 19.x.

### 3. and 6. AD-1: the unsupported list

Bundled list (`01-app/02-guides/static-exports.md`, "Unsupported Features", lines 284-296): dynamic routes with
`dynamicParams: true`; dynamic routes without `generateStaticParams()`; route handlers that rely on Request;
cookies; rewrites; redirects; headers (the `next.config` option); proxy; ISR; image optimization with the default
loader; draft mode; server actions; intercepting routes.

Spine items, checked:

| Spine item | Result |
|---|---|
| server actions, `cookies()`, proxy, redirects, rewrites, ISR, default image loader, dynamic routes without `generateStaticParams` | Correct, all in the bundled list. |
| `headers()` | Correct in effect: export forces `dynamic = "error"` on every page (`dist/server/app-render/create-component-tree.js:142-148`), so any request-time API fails. The bundled list's "Headers" is the config option, which is missing from the spine. |
| route handlers | Stricter than the framework. A `GET` handler with `export const dynamic = 'force-static'` is supported and is emitted as a static file (same doc, "Route Handlers", lines 233-255). Keeping the ban is fine; just know it is a project rule. |
| `cacheComponents`, `partialPrefetching` | Correct, but not in the bundled list. Source: `dist/export/index.js:658-660` throws `Invariant: PPR cannot be enabled in export mode` when `cacheComponents` is on; `partialPrefetching.md` says it requires `cacheComponents`. The comment in `next.config.ts` quotes the same error, so this was observed, not assumed. |

Missing, and likely to be reached for:

- **`searchParams` prop in `page.tsx`.** It is a request-time API
  (`03-api-reference/03-file-conventions/page.md:119`), so under export it fails the build. With AD-7 putting all
  state in the query string, this is the first thing a developer will try. Add it to the forbidden list.
- `export const dynamic = "force-dynamic"`, `connection()`, `revalidate`: same reason.
- An explicit `dynamicParams = true` throws (`dist/build/static-paths/app.js:553-558`).
- `next start` does not work with export; the source message says to use `npx serve@latest out`.
- Draft mode and intercepting routes: unsupported, unlikely to matter here.

Side effect worth one line in the spine: `dynamicParams` (AD-9) is only available because `cacheComponents` is off
(`.../02-route-segment-config/dynamicParams.md`: "not available when Cache Components is enabled"). AD-1 and AD-9
depend on each other.

### 4. AD-7: Suspense and writing the URL

Confirmed: the Suspense requirement is right for this version. `03-api-reference/04-functions/use-search-params.md`
lines 180-183: in a production build, a static page that calls `useSearchParams` in a client component must be
wrapped in `Suspense`, otherwise the build fails with "Missing Suspense boundary with useSearchParams". The same
note says development does not show the problem, so only `npm run build` catches it. That supports the AD-1
"build before merge" rule.

What the spine should add:

1. **How to write.** `01-app/01-getting-started/04-linking-and-navigating.md` lines 344-348 ("Native History API"):
   `window.history.pushState` and `replaceState` are integrated into the router, and components using
   `useSearchParams` update. The doc's own example is sort and filter state. Use
   `window.history.replaceState(null, '', '?' + qs)` for continuous controls and `pushState` for discrete steps the
   Back button should undo. The relative `?query` form keeps the base path and the trailing slash without any code.
   To clear all parameters, pass `window.location.pathname`, not `'?'`.
2. **Do not build the URL from `usePathname()`.** It returns the path without the base path
   (`dist/client/components/app-router.js:165` strips it), so `usePathname() + '?' + qs` passed to the History API
   points outside `/flame-atlas`. `router.replace` would re-add it, but it is a full router navigation; I did not
   measure whether it refetches the route payload in an export, so avoid it for per-keystroke updates.
3. **AD-9 wording conflict.** AD-9 allows internal navigation only through `next/link` or `useRouter`. Add the
   exception: the History API, only inside `src/lib/url-state.ts`.
4. **Anything in `layout.tsx` that reads the query needs its own Suspense.** A navigation bar that carries the
   scenario across screens is the likely case.
5. **Consequence.** With the whole feature inside the boundary, the exported HTML holds only the fallback
   (`use-search-params.md` lines 82-88). Give the boundary a real fallback, not `null`.

`trailingSlash: true`: no catch found.
- `next/link` and the router add the base path and the slash: `/tests?o2=30` becomes `/flame-atlas/tests/?o2=30`
  (`dist/client/add-base-path.js`, `dist/client/normalize-trailing-slash.js`).
- Export writes `tests/index.html` (`.../01-next-config-js/trailingSlash.md`).
- A hand-typed link without the slash still works: `curl -I "https://pages.github.com/versions?x=1"` returns
  `301`, `location: https://pages.github.com/versions/?x=1`. GitHub Pages keeps the query string.

Current tree: route files mount features without `<Suspense>` and nothing calls `useSearchParams` yet. The build
will start failing the moment a feature does.

### 5. Node row

- `01-app/01-getting-started/01-installation.md:50`: minimum Node.js 20.9. Correct for Next.js.
- Installed `vite` 8.3.8 and `rolldown` 1.2.19: `engines: ^20.19.0 || >=22.12.0`. `shadcn` 4.23.0: `>=20.18.1`.
- Node's `schedule.json`: v20 `end: 2026-04-30`. It still works and `actions/setup-node` still installs it.
- The workflow uses `node-version: 20`, which resolves to the latest 20.x, so it meets 20.19.

Correction: "Node.js 20.20.0 (toolchain needs ≥ 20.19; Node 20 is past end-of-life, accepted for the hackathon)".

### 7. AD-9: base path and the dynamic route

Confirmed:
- `next/link` and the router apply `basePath` automatically (`.../01-next-config-js/basePath.md`, "Links").
- `next/image` needs the prefix by hand, also with `unoptimized` (same doc, "Images": "you will need to add the
  `basePath` in front of `src`"; no base-path handling in `dist/shared/lib/get-img-props.js` or `image-loader.js`).
  Plain `<img src>`, `<a href>` to a file and CSS `url(/...)` are not prefixed either. `assetPath()` is the right rule.
- File-convention metadata is prefixed for you: the existing `out/index.html` has
  `href="/flame-atlas/favicon.ico?..."`. So the scaffold was built once with the base path set.
- `generateStaticParams` plus `dynamicParams = false` is correct. Leaving `dynamicParams` unset also builds; only
  an explicit `true` throws.

Add to the rule:
- `params` is a Promise in this version (`04-functions/generate-static-params.md`, every example). The current
  `[id]/page.tsx` already awaits it.
- With export, `generateStaticParams` returning an empty array fails the build:
  `dist/build/static-paths/app.js:457-458`, "returned an empty array ... With output: export, at least one route
  must be generated". If `data/processed/investigations.json` is ever empty, the deploy breaks.
- Fixture ids (`PSI-25`, `PSI-159`) are URL-safe. Keep ids free of dots: the trailing-slash normaliser treats a
  last segment containing a dot as a file.

### 8. AD-2: JSON through `@/generated`

Confirmed workable:
- `01-app/03-api-reference/08-turbopack.md:109`: JSON imports supported. Line 115: Turbopack reads `tsconfig.json`
  `paths`. `tsconfig.json` has `resolveJsonModule: true` and `@/*`.
- Line 345: "Files outside of the project root are not resolved." The root is `apps/web` (the only lockfile is
  `apps/web/package-lock.json`), so `data/` and `contracts/` cannot be imported directly. Copying is necessary,
  not just tidy.
- `tsc --noEmit --incremental false` on the current tree: exit 0 in 2.4 s.

Catches:
1. **Props across the boundary.** A dataset passed from a server component to a client component is serialised
   into that page's HTML and its `.txt` payload, once per route (24+ investigation pages). Rule: client components
   import from `@/lib/data`; route files pass an id or a single record. The current `[id]/page.tsx` passes one
   investigation, which is fine.
2. **Size.** `docs/03-data-sources.md:93` gives 2 870 rows; fixtures average 1.57 KB per row, so `tests.json` will
   be about 4.5 MB inside a client chunk. `lib/data.ts` imports all four files in one module, so every client
   screen that imports it loads all of them. Whether Turbopack drops unused JSON exports is not verified. Look at
   `out/_next/static/chunks` after the first real-data build; the Deferred item already names the fallback.
3. **Type-check cost is not a concern.** Synthetic test: importing a 4.5 MB, 2 870-row JSON type-checks in 1.1 s
   with 243 MB of memory.
4. **No compile-time check of the data.** TypeScript widens JSON literals, so the gateway must cast
   (`as unknown as TestRecord[]`, as `data.ts` does). The only validation is `contracts/validate.py`.
5. **Wording.** The spine says `contracts/types.ts` is copied into `src/generated/` and imported from
   `@/generated/contract`. The script has to rename it to `contract.ts` (it does). It also writes a fifth file,
   `source.json`.
6. **Vitest does not read `tsconfig` paths.** The `@` alias must be repeated in the Vitest config (it is, in
   `vitest.config.mts`).
7. **`tsc` in a clean checkout.** `LayoutProps` and `PageProps` are generated by `next dev`, `next build` or
   `next typegen` (`01-getting-started/03-layouts-and-pages.md:337`). `npm run typecheck` before any of those
   fails. The workflow does not call it, and `next build` type-checks anyway.

## Stack table, row by row

| Row | Registry | Installed | Fits? |
|---|---|---|---|
| Node.js 20.20.0 | n/a | `node -v` = v20.20.0 | Yes, see finding 5. |
| npm 11.17.0 | `engines: ^20.17.0 \|\| >=22.9.0` | `npm -v` = 11.17.0 | Yes. CI uses the npm bundled with Node 20; `lockfileVersion` is 3, which both read. |
| Next.js 16.4.6 | latest = 16.4.6 (2026-11-09) | 16.4.6 | Yes. `engines: >=20.9.0`, peer `react ^19.0.0`. Turbopack is the default bundler (`08-turbopack.md:39`). |
| React, React DOM 19.3.0 | latest = 19.3.1 | 19.3.0 | Yes. A patch release exists; no need to move. |
| TypeScript 5.9.3 | latest = 7.0.2; 5.9.3 is the last 5.x | 5.9.3 | Yes. Minimum is 5.1.0 (`01-installation.md:324`). `"^5"` keeps it on 5.x; do not install `@latest`. |
| Tailwind CSS 4.3.3, `@tailwindcss/turbopack` | latest = 4.3.5 | 4.3.3 both | Yes. `next.config.ts` matches the loader's README exactly. |
| ESLint 9.39.5, `eslint-config-next` 16.4.6 | 10.15.0, 16.4.6 | 9.39.5, 16.4.6 | Yes. Peer is `eslint >=9.0.0`. |
| Vitest 5.1.0 | latest = 5.1.0 | 4.1.12 | **No**, see finding 1. |
| Recharts 3.10.1 | latest = 3.10.1 | not installed | Yes with `react-is@19.3.0`, see finding 2. Not render-tested. |
| GitHub Pages via Actions | n/a | workflow present | Yes, see below. |

`npm ls --all` reports no invalid or unmet peers (only other-platform optional binaries, which is normal). The
lockfile contains the Linux bindings CI needs (`@next/swc-linux-x64-gnu`, `@tailwindcss/oxide-linux-x64-gnu`,
`lightningcss-linux-x64-gnu`, `@rolldown/binding-linux-x64-gnu`).

## Deployment

Workable as planned.

- **`.nojekyll` is not needed** when the site is deployed as an Actions artifact. The official template the bundled
  docs point to (`static-exports.md:365`, `nextjs/deploy-github-pages`) uploads `./out` with
  `actions/upload-pages-artifact@v3` and `actions/deploy-pages@v4` and creates no `.nojekyll`. Jekyll only runs for
  "Deploy from a branch". `upload-pages-artifact` also excludes dotfiles by default (`include-hidden-files: false`),
  so a `public/.nojekyll` would not even be uploaded. `_next` starts with an underscore, not a dot, and is included.
- **Do not use `static_site_generator: next`** in `actions/configure-pages`. It only edits `.js`, `.cjs` and `.mjs`
  configs in the repository root; this project has `apps/web/next.config.ts`. The workflow does not use it. Good.
- **Base path.** The workflow sets `NEXT_PUBLIC_BASE_PATH: /${{ github.event.repository.name }}`. `gh repo view`:
  the repository is `flame-atlas`, public, default branch `main`, so the value is `/flame-atlas`. The official
  template reads the same value from `configure-pages` output `base_path`; either is fine without a custom domain.
- **Pages is not enabled yet.** `gh api repos/{owner}/{repo}/pages` returns 404. The first `deploy` job will fail
  until the owner sets Settings → Pages → Source: "GitHub Actions". The spine's Deferred list has this; do it today.
- **404.** With `trailingSlash: true` the export writes both `out/404.html` and `out/404/index.html` (present in
  the existing `out/`). GitHub Pages serves the root `404.html`.
- Local check of a base-path build: `next start` will not serve it. Serve a folder that contains `out` renamed to
  `flame-atlas`, so the URLs match.

## Not verified

- Recharts rendering under React 19.3.0 and Turbopack (not installed).
- `npx shadcn init` (CLI 4.23.0) against Tailwind 4 with the Turbopack loader and no PostCSS config. There is no
  `components.json` yet, and the CLI adds runtime dependencies that are not in the Stack table. Run it once, early,
  by the owner of dependencies.
- Whether `router.replace` with only a new query refetches the route payload in an export.
- Real bundle size and whether unused JSON exports are dropped.
- A full `next build` and `vitest run` of the current tree. The existing `out/` (17:16) shows the bare scaffold
  built with the base path set.
- `next/font/google` in `layout.tsx` downloads fonts at build time; not tested offline.

## Suggested edits to the spine

1. Stack: Vitest 4.1.12 (Vite 8.3.8); add `react-is 19.3.0` next to Recharts; Node note "toolchain needs ≥ 20.19".
2. AD-1: add "`searchParams` prop in `page.tsx`, `force-dynamic`, `connection()`"; add config `headers`; say that
   route handlers are a project ban.
3. AD-7: name the write mechanism (History API, relative `?query`, only in `url-state.ts`); forbid building URLs
   from `usePathname()`; require a non-empty fallback; note that only the build detects a missing boundary.
4. AD-9: add the History API exception; `params` is awaited; `generateStaticParams` must not return `[]`.
5. AD-2: datasets never cross the server-to-client boundary as props; the types file is copied as `contract.ts`.
