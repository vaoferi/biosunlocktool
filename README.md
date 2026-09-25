# BIOS Unlock Tool — Multilingual Landing Pages

Це статичний Cloudflare Pages-проєкт із однією спільною структурою landing page,
market-specific темами та окремими мовними копіями для Польщі й Німеччини.
Канонічний SEO-URL для всіх production market variants залишається
`https://biosunlocktool.com/`; субдомени — це регіональні входи й візуальні
експерименти, а не окремі SEO-сайти.

## Структура

```text
/
├── index.html                    → shared landing / root entry
├── assets/                       → shared CSS, JS, models and images
├── locales/
│   ├── en-US/                    → committed copy of the shared English landing
│   ├── en-IN/                    → legacy Hindi stub; не маршрутизується
│   ├── de-DE/                    → German landing source
│   ├── pl-PL/                    → Polish landing source
│   └── af-ZA/                    → Africa English landing source
├── functions/_middleware.ts      → host-aware locale routing and clean redirects
├── .github/workflows/deploy.yml  → GitHub Actions deploy workflow
├── wrangler.toml                 → Cloudflare Pages configuration
├── SETUP.md                      → operator runbook
└── docs/
    ├── deployment.md             → build, deploy and smoke-test procedure
    └── market-routing.md         → routing and language decisions
```

`build.js` поки не компілює локалі й не копіює файли: усі статичні сторінки та
асети вже зберігаються в репозиторії. `npm run build` лише перевіряє, що
build-entrypoint запускається; фактичну коректність змін підтверджують diff і
browser smoke test.

## Джерело канону і синхронізація

Канонічна English landing живе у sibling workspace/repository
`nexxgsm-design/versions/en-US-landing/`. Корінь цього репозиторію та
`locales/en-US/` — деплой-копії для Cloudflare Pages. Порядок релізу:

1. змінити канон;
2. перевірити його на NAS staging;
3. синхронізувати повну поверхню в цей репозиторій (включно з новими файлами,
   favicon, preload, canonical/OG URL та cache-busted asset URLs);
4. перевірити diff, build і production smoke test.

Не редагуйте лише CF-копію, якщо зміна має залишатися в каноні: наступна ручна
синхронізація може її перезаписати.

Стан синхронізації на 2026-09-11: production-копії вже містять
`main.css?v=20260910y` і `india-language.js?v=20260910k`, тоді як canonical
workspace ще має `main.css?v=20260910x` і не містить India language script. Це
зафіксована sync-різниця: перед наступним релізом її треба вирішити й перевірити
byte-identity, а не перезаписувати production-копію навмання.

## Cloudflare Pages

- **Pages project**: `biosunlocktool`
- **Custom domains**: `biosunlocktool.com`, `www`, `us`, `ca`, `in`, `pl`, `de`,
  `af` налаштовуються в Cloudflare Dashboard → Pages → Custom domains.
- **GitHub Actions**: workflow `Deploy to Cloudflare Pages` запускається на push
  у `main` і вручну через `workflow_dispatch`.
- **GitHub secrets**: workflow очікує `CF_ACCOUNT_ID` і `CF_API_TOKEN`; токен
  має мати право **Account → Cloudflare Pages → Edit**.
- **Ручний fallback**: якщо Actions не проходить автентифікацію, перевірте
  локальний `npx wrangler whoami` і використайте `npm run deploy` після
  `npm run build`.

Стан перевірки на 2026-09-11: локальна автентифікація Wrangler і прямий Pages
deploy працюють; останні GitHub Actions завершилися з Cloudflare API error
`10000` (невалідні або недостатні права секрету `CF_API_TOKEN`). Це не треба
маскувати повторними спробами — спочатку оновлюється саме repository secret.

Детальний runbook: [SETUP.md](SETUP.md) і [docs/deployment.md](docs/deployment.md).

## Команди

Команди запускаються на NAS Linux у canonical checkout, не на робочій станції:

```bash
npm install
npm run build
npm run check
```

Локальний Pages runtime для перевірки маршрутизації — теж на NAS:

```bash
npx wrangler pages dev . --local --ip 127.0.0.1 --port 8788
```

`npm run deploy` навмисно не тут: реліз іде через GitHub Actions на push у
`main` або через `workflow_dispatch`, і потребує явної команди власника
(деталі — `docs/deployment.md`). Історично для Windows існував обхід із
mapped drive замість UNC-шляху, бо запуск з `\\nas\homes\...` іноді змінював
effective working directory; на NAS Linux ця причина не існує, тому обхід
лишається лише нотаткою для діагностики, а не підтримуваним шляхом.

## Маршрути

| Домен | Публічна мова | Внутрішнє джерело | Тема |
|---|---|---|---|
| `biosunlocktool.com` | English (`en-US`) | `/index.html` | US / signal lattice |
| `www.biosunlocktool.com` | English (`en-US`) | `/index.html` | apex alias |
| `us.biosunlocktool.com` | English (`en-US`) | `/index.html` | US / signal lattice |
| `ca.biosunlocktool.com` | English (`en-US`) | `/index.html` | Canada / maple lattice |
| `in.biosunlocktool.com` | English за замовчуванням; Hindi toggle | `/index.html` | India atmosphere |
| `pl.biosunlocktool.com` | Polish (`pl-PL`) | `/locales/pl-PL/index.html` | Poland experiment |
| `de.biosunlocktool.com` | German (`de-DE`) | `/locales/de-DE/index.html` | Germany experiment |
| `af.biosunlocktool.com` | English (`en-ZA`) | `/locales/af-ZA/index.html` | Africa experiment |

Технічні шляхи `/locales/pl-PL/`, `/locales/de-DE/` і `/locales/af-ZA/`
не є публічними адресами: точний document path отримує `301` на clean root
відповідного субдомену. Assets та інші unrelated paths не переписуються.

## Language and market policy

- `in.biosunlocktool.com` використовує shared English landing із India theme.
  Кнопка Hindi змінює видимий marketing copy та guide content на місці,
  зберігаючи clean URL, canonical і `og:url`. Для нового відвідувача default —
  English; явний вибір можна запам'ятати в `localStorage`. Browser-language
  auto-detection не використовується.
- `locales/en-IN/index.html` — legacy Hindi stub зі старою структурою; він не
  маршрутизується middleware і не повинен повертатися як production India root.
- Canada має English copy; адаптація ринку — візуальна, через `data-market` і
  CSS tokens, а не переклад.
- Poland і Germany мають повні локалізовані сторінки; Africa — English
  (`en-ZA`) regional theme, а не автоматичний переклад африканською мовою.

## Background experiments

Спільна CSS-геометрія зберігає однаковий hero/computer layout, а ринки змінюють
тільки атмосферу, accent tokens, glass tint і selected-card emphasis:

- **US**: dark navy signal lattice із fine grid і sparse points;
- **Canada**: dark ink, maple-red та ice-blue diagonal lattice;
- **India**: saffron/navy/green atmosphere із restrained dust field;
- **Poland**: graphite/carmine paper та industrial lines;
- **Germany**: steel-blue blueprint grid з amber signal light;
- **Africa**: indigo/terracotta/ochre textile geometry.

Декоративні шари CSS-only, залишаються на mobile і вимикають рух під
`prefers-reduced-motion: reduce`. Після зміни shared stylesheet потрібно
оновити query version `main.css?v=...` у всіх landing HTML-файлах, інакше edge
може віддати стару тему.

## Перевірка перед публікацією

1. `git status --short` і `git diff --check`.
2. `npm run build`.
3. Перевірити root-и семи market-доменів і `www` alias у браузері: потрібний текст/`lang`,
   тема ринку, відсутність horizontal overflow і критичних console errors.
4. Перевірити legacy redirect для `pl`, `de`, `af` і clean final URL.
5. Лише після цього запускати `npm run deploy` або workflow.

Повна послідовність і fallback описані в [docs/deployment.md](docs/deployment.md).
