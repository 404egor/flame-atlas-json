# Роль B — Data engineer: завантаження, розбір документів, інфраструктура

**Кому підійде:** тому, хто любить API, скрипти, файли й щоб усе запускалось однією командою.
**Місія:** дістати з PSI все потрібне, перетворити документи на текст з номерами сторінок і тримати
репозиторій, збірку й деплой у робочому стані.

## Зона відповідальності

- `pipeline/src/ingest/`, `parse/`, `enrich/`, `index/`.
- `data/raw/`, `data/interim/`.
- `data/processed/sources.json`, `chunks.json`, `search-index.json`; поле `publications` у картках.
- Кореневі конфіги, pnpm workspace, CI, Vercel, `.env.example`, README.

## Що отримуєш і що віддаєш

| Кому | Що | Коли |
|---|---|---|
| A | метадані 24 досліджень і 22 CSV у `data/raw` | **субота до 16:30**, це розблоковує A |
| A | текст документів посторінково в `data/interim` | субота до 20:00 |
| A, D | `sources.json`, `chunks.json`, `search-index.json` | субота до 23:00 |
| усім | репозиторій, що збирається, і деплой на Vercel | перша година |

## Задачі за фазами

### Старт (перші 45 хвилин, разом з D)
- [ ] Репозиторій: pnpm workspace (`packages/*`, `pipeline`, `apps/web`), TypeScript, спільний tsconfig,
      `.gitignore` (`.env*`, `.cache/`, великі файли `data/raw`), `.env.example`.
- [ ] CI на GitHub Actions: `pnpm typecheck && pnpm build && pnpm test` на кожен пуш.
- [ ] Vercel-проєкт, підключений до `main`. Перше публічне посилання в чаті команди.
- [ ] Покласти в корінь `AGENTS.md`, `CLAUDE.md`, `docs/`, `roles/`, `data/fixtures/`.

### Фаза 1 (субота до 18:30): усе з PSI на диску
- [ ] `pipeline:ingest`, крок 1: список досліджень → фільтр Combustion Science → 24 ID.
      Звірити зі списком у `docs/03-data-sources.md`.
- [ ] Крок 2: деталі кожного → `data/raw/PSI-xx/metadata.json`.
- [ ] Крок 3: 22 CSV з `experimentalTable[]` → `data/raw/PSI-xx/tables/`. **Термін 16:30.**
- [ ] Крок 4: індекс файлів `data/raw/files-index.json`: назва, папка, розмір, версія.
      Для досліджень з порожнім `added[]` знайти запит дерева файлів через DevTools → Network
      на сторінці дослідження (див. «Підводні камені» в `docs/03-data-sources.md`).
- [ ] Крок 5: завантажити документи за пріоритетом: ReadMe → Test Matrices → SRD → Summary / Final Report.
      Ліміт 60 МБ на файл. Папки `Raw Data` пропускати.
- [ ] Усе з кешем: повторний запуск нічого не качає вдруге. Запити послідовні, з паузою.

**Готово, коли:** `data/raw` містить 24 `metadata.json` і 22 CSV; у журналі видно, яких документів
не вдалося дістати і чому.

### Фаза 2 (субота до 23:00): текст і статті
- [ ] `pipeline:parse`: PDF → текст посторінково (`unpdf` або `pdftotext`), DOCX (`mammoth`),
      XLSX (`xlsx`, кожен аркуш окремо), `.doc` і `.ppt` через LibreOffice або пропуск із записом у журнал.
- [ ] Вихід: `data/interim/PSI-xx/<doc>.json` = `{ sourceId, pages: [{ n, text }] }`.
- [ ] `pipeline:index`: `sources.json` (кожен документ, публічне посилання на сторінку PSI або DOI),
      `chunks.json` (фрагмент = сторінка; довгі сторінки ділити; `locator` = `p.N`).
- [ ] `pipeline:enrich`: для кожної статті з DOI взяти анотацію, рік, відкрите посилання з OpenAlex,
      запасний варіант Crossref. Результат — у `publications` карток. Анотації додати в `chunks.json`
      як джерела `publication-abstract`.
- [ ] Загальні джерела: текст NASA Researcher's Guide to ISS Combustion Science і сторінки NASA Glenn
      Combustion Science з `investigationId: null`.

**Готово, коли:** `chunks.json` покриває щонайменше 18 з 24 досліджень; у кожного фрагмента є
`sourceId` і `locator`.

### Фаза 3 (неділя до 13:00): пошук і надійність
- [ ] `search-index.json`: MiniSearch по `chunks.json`, поля `text` і назва дослідження, з підсиленням
      абревіатур.
- [ ] `pnpm pipeline:all` і `pnpm data:check` (zod-перевірка всіх файлів `data/processed`, підрахунки).
- [ ] Перевірити розмір збірки: якщо `chunks.json` завеликий для клієнта, читати його лише на сервері.
- [ ] Env на Vercel, перевірка `/api/ask` на проді.

### Фаза 4 (неділя до 17:00): чистота
- [ ] Виправлення даних за знахідками E.
- [ ] README англійською: що це, посилання на демо, знімки екрана, як запустити, як перезібрати дані,
      джерела й ліцензії.
- [ ] Репозиторій публічний, файл LICENSE, жодних ключів в історії.
- [ ] Допомога E: список усіх бібліотек і джерел для `submission/references.md`.

### Якщо лишився час
- Звіти з NTRS для досліджень, де в PSI немає документів.
- Зображення з `images[]` метаданих PSI для карток (вони CC0).

## З ким синхронізуватись

- **A**, постійно: що вже лежить у `data/raw` і `data/interim`, у якому форматі.
- **D**, на старті: каркас репозиторію й деплой.
- **E**: які документи найважливіші, якщо все завантажити не вдається.

## Ризики ролі

- Порожній `added[]` у FLEX, FLEX-2, SAFFIRE-II, E-FIELD. Якщо за 40 хвилин запит дерева файлів
  не знайдено — переходь на ручне завантаження ключових документів і повідом у чат.
- PDF-скани без текстового шару. Не розпізнавай їх: познач `parsed: false` і йди далі.
- Тимчасові посилання S3 спливають: отримуй посилання безпосередньо перед завантаженням файлу.

## Стартовий промпт для агента

```
Ти працюєш у ролі B (Data engineer) проєкту Flame Atlas. Прочитай AGENTS.md, roles/B-data-engineer.md,
docs/03-data-sources.md і docs/04-contracts.md. Потім виконай блок «Старт»: створи pnpm workspace
з packages/contracts, packages/core, pipeline і apps/web (Next.js App Router, TypeScript, Tailwind),
CI на GitHub Actions і .env.example. Після цього почни pipeline:ingest за кроками Фази 1: спершу метадані
24 досліджень і 22 CSV, бо вони блокують роль A. Перед кодом покажи короткий план.
Запити до psi.nasa.gov роби послідовно, з паузою і кешем на диску.
```
