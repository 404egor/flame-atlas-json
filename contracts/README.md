# Контракт даних між пайплайном і сайтом

Версія **1.1.0**. Це єдина межа між командами: команда «Дані й AI» пише чотири JSON-файли,
команда «Продукт» їх читає. Усе інше команди вирішують усередині.

## Як користуватись

| Хто | Що робить |
|---|---|
| Команда «Продукт» | імпортує типи з [`types.ts`](types.ts); до появи справжніх даних читає файли з `data/fixtures`, потім з `data/processed`. Назви файлів і формат однакові |
| Команда «Дані й AI» | пише файли в `data/processed` і перед кожним комітом запускає перевірку |

```bash
python3 contracts/validate.py data/processed
```

Перевірка написана на чистому Python, встановлювати нічого не треба. Вона звіряє кожен файл зі схемою
з [`schema/`](schema) і перевіряє зв'язки між файлами. Зразки проходять її вже зараз:

```bash
python3 contracts/validate.py data/fixtures
```

## Чотири файли

| Файл | Що в ньому | Схема | Тип |
|---|---|---|---|
| `tests.json` | єдина таблиця рядків із таблиць експериментів PSI | [`tests.schema.json`](schema/tests.schema.json) | `TestRecord[]` |
| `investigations.json` | картки досліджень, 24 записи | [`investigations.schema.json`](schema/investigations.schema.json) | `Investigation[]` |
| `scenarios.json` | готові сценарії середовищ | [`scenarios.schema.json`](schema/scenarios.schema.json) | `Scenario[]` |
| `meta.json` | що містить ця збірка даних: версія, лічильники, якість, обмеження | [`meta.schema.json`](schema/meta.schema.json) | `Meta` |

Джерело правди — JSON-схеми. `types.ts` їх повторює і змінюється в тому самому коміті.

## Загальні правила

1. **`null` означає «у джерелі не вказано».** Ніколи не нуль і не порожній рядок. Сайт показує `null` як «not reported».
2. **Одиниці фіксовані й записані в назві поля:** кисень у % об. (`Pct`), тиск у кПа (`Kpa`),
   швидкість потоку в см/с (`CmS`), розміри в мм (`Mm`), час у секундах (`S`), швидкість поширення в мм/с (`MmS`).
   Перерахунок: 1 psi = 6.894757 кПа, 1 atm = 101.325 кПа, 1 bar = 100 кПа, 1 mmHg = 0.133322 кПа,
   мольна частка × 100 = % об.
3. **Пари `Min` / `Max`.** Одне значення в джерелі: `Min` = `Max`. Діапазон або перелік: `Min` < `Max`.
   Обидва поля або заповнені, або `null`.
4. **`raw` заповнене завжди.** Це всі колонки вихідного рядка дослівно, з пробілами й одруківками заголовків.
5. **`inferred`** перелічує поля, які взято не з колонки таблиці, а з документа чи припущення
   (наприклад, `gravity` для польотного експерименту).
6. **Нічого не вигадуємо.** Немає значення в джерелі — поле `null`, пояснення в `notes`.
7. **Кожне твердження в картці має джерело** (`citations`, щонайменше одне).
8. Ключі полів англійською, у стилі camelCase. Тексти для користувача англійською.

## `tests.json`: один рядок таблиці PSI

| Поле | Тип | Зміст |
|---|---|---|
| `id` | string | `дослідження:таблиця:мітка-або-рядок`, наприклад `PSI-25:BASS-II:B1`; унікальний |
| `investigationId` | string | `PSI-25`; має існувати в `investigations.json` |
| `tableFile` | string | назва файла таблиці в PSI |
| `sourceRow` | integer ≥ 1 | номер рядка даних у вихідному CSV |
| `granularity` | enum | що таке цей рядок, див. нижче |
| `label`, `date` | string \| null | мітка тесту; дата у форматі `YYYY-MM-DD` |
| `fuelName`, `fuelState`, `fuelGeometry`, `fuelRaw` | string \| null | матеріал, стан (`solid`, `liquid`, `gas`, `aerosol`), форма, вихідний рядок |
| `thicknessMm`, `widthMm`, `diameterMm` | number \| null | розміри зразка |
| `o2PctMin`, `o2PctMax` | number \| null | початкова частка кисню |
| `o2PctValues` | number[] \| null | якщо в джерелі перелік: `21; 26.5; 40` |
| `o2PctApprox` | boolean | `true`, якщо джерело позначає значення як наближене |
| `o2PctFinal`, `co2Pct` | number \| null | кінцева частка кисню; частка CO₂ |
| `diluent` | string \| null | `N2`, `CO2`, `He` |
| `pressureKpaMin`, `pressureKpaMax` | number \| null | тиск |
| `flowCmSMin`, `flowCmSMax` | number \| null | швидкість потоку |
| `flowDirection` | enum | `opposed`, `concurrent`, `coflow`, `quiescent`, `unknown` |
| `gravity` | enum | `micro`, `normal`, `partial-simulated` |
| `ignited`, `coolFlame` | boolean \| null | чи зайнялось; чи було холодне полум'я |
| `outcome` | enum \| null | `self-extinguished`, `flow-terminated`, `burned-out`, `blowoff`, `disruption`, `not-ignited`, `other` |
| `burnTimeS`, `spreadRateMmS` | number \| null | час горіння; швидкість поширення полум'я |
| `notes` | string \| null | пояснення й аномалії джерела |
| `raw` | object | усі вихідні колонки як рядки |
| `inferred` | string[] | які поля взято не з колонки |
| `confidence` | enum | `high`, `medium`, `low` |
| `mappingVersion` | string | версія маппінгу таблиці |

**`granularity`: рядок не завжди є окремим тестом.**

| Значення | Що це | Приклад |
|---|---|---|
| `test` | один запуск експерименту | BASS-II, FLEX, CFI-G, Saffire |
| `test-day` | підсумок дня тестів, часто з кількома значеннями кисню | ACME BRE, CLD Flame, E-FIELD, s-Flame |
| `matrix-row` | рядок матриці умов: діапазони для одного палива | FLEX-2 |
| `reference` | посилання на рисунок у статті | PSI-142 |

Сайт рахує «кількість тестів» лише за рядками `test`, а решту показує окремо.

## `investigations.json`: картка дослідження

| Поле | Зміст |
|---|---|
| `id`, `acronym`, `title`, `doi`, `url` | ідентифікація; `url` — публічна сторінка дослідження |
| `kind` | `flight` або `ground` |
| `platform`, `facility`, `insert` | де проводили: `ISS` / `Cygnus`; `MSG` / `CIR`; `ACME` / `MDCA` |
| `yearStart`, `yearEnd` | роки |
| `pillarPrimary`, `pillarsSecondary` | напрям безпеки: `prevention`, `detection`, `suppression`, `fundamentals` |
| `fuelStates`, `fuels` | які палива й у якому стані |
| `fuelAnalogOf` | необов'язкове (з 1.1.0): `{ states, claim }`, якщо дослідження одним паливом імітує палива іншого стану (газовий пальник ACME BRE імітує тверді й рідкі); інакше `null` або поля немає |
| `conditions` | діапазони кисню, тиску, потоку, розбавлювачі, гравітація; **рахує пайплайн із `tests.json`** |
| `summary` | короткий опис, одне твердження з джерелом |
| `objectives`, `measurements`, `fireSafetyRelevance` | переліки тверджень із джерелами |
| `testStats` | файли таблиць, кількість рядків, типи рядків |
| `publications` | назва, рік, DOI |
| `review` | стан ручної перевірки картки |

Твердження: `{ "text": "...", "citations": [{ "label": "...", "url": "https://...", "quote": "..." | null }] }`.
`quote` — дослівна цитата, яку перевірив код; для посилань на таблицю `null`.

## `scenarios.json`: сценарій середовища

`id`, `name`, `description`, `o2Pct`, `pressureKpa`, `gravityG` (0, 0.165, 0.38, 1), `flowCmSMin`, `flowCmSMax`,
`fuelStates`, `focus` (напрям безпеки або `all`), `sources`, `assumptions`.
У `assumptions` чесно записано, які числа сценарію є припущенням.

## `meta.json`: паспорт збірки

`contractVersion`, `generatedAt`, `source`, `counts` (досліджень, рядків, таблиць), `tables` (скільки рядків
зведено з кожної таблиці), `quality` (скільки значень перевірено вручну і скільки з них правильні),
`dataNotes` (відомі обмеження даних, які сайт показує користувачу).

## Що в файли не входить

Це рахує сайт із наведених даних, і в контракт воно не потрапляє:

- бал релевантності та його складники;
- сітка покриття й список прогалин;
- клас атмосфери: «як на місячній базі» означає `o2Pct ≥ 30` і `pressureKpa ≤ 70.3`;
- матриця «що змінювалось між тестами одного дослідження».

Пороги й ваги лежать в одному конфігу на боці сайту.

## Як змінювати контракт

1. Змінює лише власник контрактів (команда «Дані й AI»).
2. Нове необов'язкове поле: мінорна версія (1.1.0). Зміна чи видалення поля: мажорна версія (2.0.0)
   і повідомлення в чат команди до злиття.
3. В одному коміті змінюються схема, `types.ts`, зразки в `data/fixtures` і номер версії.
4. Перевірка на зразках має проходити.

## Пізніше, не зараз

Якщо додамо живий підсумок від LLM (Evidence brief), з'явиться п'ятий файл `briefs.json` із заготовленими
підсумками для сценаріїв. Поки його немає і сайт на нього не розраховує.
