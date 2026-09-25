# Market routing and language decisions

## Контекст

Landing починався як одна US English page, а потім отримав market-specific
субдомени. Візуальні експерименти не повинні перетворюватися на п'ять окремих
проєктів або виставляти технічний каталог локалі в публічній URL.

## Поточне рішення

| Host | Публічна мова | Внутрішнє/static source | Visual theme |
|---|---|---|---|
| `biosunlocktool.com` | English (`en-US`) | `/index.html` | US / signal lattice |
| `us.biosunlocktool.com` | English (`en-US`) | `/index.html` | US / signal lattice |
| `ca.biosunlocktool.com` | English (`en-US`) | `/index.html` | Canada / maple lattice |
| `in.biosunlocktool.com` | English (`en-US`) by default; Hindi toggle | `/index.html` | India atmosphere |
| `pl.biosunlocktool.com` | Polish (`pl-PL`) | `/locales/pl-PL/index.html` | Poland experiment |
| `de.biosunlocktool.com` | German (`de-DE`) | `/locales/de-DE/index.html` | Germany experiment |
| `af.biosunlocktool.com` | English (`en-ZA`) | `/locales/af-ZA/index.html` | Africa experiment |

Усі hosts залишаються в одному Cloudflare Pages project `biosunlocktool`.
Канонічні `canonical` і `og:url` навмисно вказують на
`https://biosunlocktool.com/`; субдомени — market entry points, а не окремі
SEO-каноникали.

## Поверхні публікації й що саме між ними синхронізується

Різні мовні версії — це окремі версії сайту, а не технічні копії одна одної.
Виміряний склад репозиторія:

| поверхня | файлів | власні ассети | як посилається на CSS | що це |
|---|---|---|---|---|
| `/` (корінь) | лендінг повністю | так | `assets/...` відносно | англійська версія: apex, `us`, `ca`, `in` |
| `locales/en-US/` | 7 | так (5) | `assets/...` відносно | повна копія англійського лендінга |
| `locales/de-DE/` | 1 | немає | `/assets/...` абсолютний | окрема німецька версія сторінки |
| `locales/pl-PL/` | 1 | немає | `/assets/...` абсолютний | окрема польська версія сторінки |
| `locales/af-ZA/` | 1 | немає | `/assets/...` абсолютний | окрема англомовна версія для Африки |
| `locales/en-IN/` | 1 | немає | `/assets/...` абсолютний | legacy Hindi stub, не маршрутизується |

Наслідки, які треба тримати в голові:

- Єдина пара, де вміст має бути байт-тотожним, — корінь і `locales/en-US/`.
  Це два способи подання одного й того самого англійського лендінга, тому
  розбіжність між ними є дефектом, а не варіантом. Її ловить
  `npm run check` (`scripts/check-surface-parity.mjs`).
- `de-DE`, `pl-PL`, `af-ZA` — свідомо окремі версії: свій текст, своя мова,
  жодного дублювання ассетів. Вони читають спільні `/assets/*` з кореня, тому
  зміна спільного CSS вимагає оновлення cache stamp в кожному з цих HTML, а не
  копії файлів.
- Контент лендінга створюється не тут. Канонічне джерело англійського
  лендінга — `versions/en-US-landing/` у репозиторії `vaoferi/nexxgsm-design`;
  корінь і `locales/en-US/` у цьому репо — поверхні публікації Cloudflare
  Pages. Факт напрямку підтверджений байтами, а не припущенням.

## India language boundary

`locales/en-IN/index.html` — legacy Hindi stub із іншою структурою та старим
purchase flow. Він навмисно не маршрутизується на production
`in.biosunlocktool.com`.

Поточний India root починається англійською. `assets/js/india-language.js`
додає явний Hindi toggle, який змінює видимий marketing copy, guide content і
selected-plan label на місці, без зміни clean URL або canonical metadata. Fresh
visitor ніколи не визначається автоматично за мовою браузера; лише явний вибір
може бути збережений у `localStorage`.

## Clean subdomain roots

`functions/_middleware.ts` має коротку карту host → locale тільки для `de`,
`pl` і `af`. `ca` та `in` свідомо проходять до shared root, де CSS визначає
market theme за `data-market`.

Для `de`, `pl` і `af` Pages Function робить внутрішній `ASSETS.fetch` із
trailing slash. Pages інакше канонізує static `index.html` до directory URL і
може витекти технічним `/locales/<locale>/` redirect-ом у браузер.

Точні legacy document paths:

```text
/locales/<locale>/
/locales/<locale>/index.html
```

отримують `301` на clean root відповідного регіонального субдомену. Assets та
інші application paths не переписуються, тому це не глобальний catch-all
redirect.

## Visual theme rule

Market adaptation обмежена background atmosphere, accent tokens, glass tint і
selected-card emphasis. Hero figures, layout geometry, copy structure та
conversion behavior залишаються спільними для порівнянності експериментів.
Animated decorative layers повинні мати static fallback і вимикатися під
`prefers-reduced-motion: reduce`.

## Перевірка рішення

Перед публікацією перевіряйте фактичний DOM/runtime, а не тільки `HTTP 200`:

- `lang`, hero copy та background відповідають host;
- India toggle перемикає English ↔ Hindi без зміни URL/canonical;
- legacy locale document paths повертають `301` на clean root;
- немає horizontal overflow, критичних console errors або mojibake;
- CSS cache stamp оновлено в усіх landing HTML-файлах після зміни shared CSS.
