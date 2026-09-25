# Запуск і підтримка `biosunlocktool.com`

> Runbook перевірено 2026-09-11. Він описує фактичну Pages-схему, а не старий
> припущений flow зі створенням окремих проєктів для кожної локалі.

## Поточна архітектура

- Це один Cloudflare Pages project: **`biosunlocktool`**.
- Кореневий `index.html` — shared English landing для apex, `us`, `ca` та `in`.
- `functions/_middleware.ts` маршрутизує `de`, `pl` і `af` на статичні копії
  з `/locales/de-DE/`, `/locales/pl-PL/` і `/locales/af-ZA/` через `ASSETS.fetch`.
  Для відвідувача URL залишається clean root субдомену.
- Точні legacy document paths `/locales/<locale>/` та
  `/locales/<locale>/index.html` на цих трьох субдоменах отримують `301` на
  відповідний clean root. Assets та довільні шляхи не переписуються.
- `in.biosunlocktool.com` починається англійською; Hindi вмикається явною
  кнопкою на клієнті. `locales/en-IN/index.html` — legacy stub, не production
  маршрут.
- Усі production landing pages використовують canonical і `og:url`
  `https://biosunlocktool.com/`.

Повний опис ринків: [docs/market-routing.md](docs/market-routing.md).

Канонічне джерело English landing — sibling
`nexxgsm-design/versions/en-US-landing/`; цей репозиторій містить його Pages
копії в корені та `locales/en-US/`. Перед production release спочатку перевірте
канон на NAS, потім синхронізуйте повну поверхню копій і лише після цього
запускайте build/deploy.

## Передумови

- Node.js 20+ (GitHub Actions використовує Node.js 22);
- npm;
- Cloudflare access до account, де живе Pages project;
- для CI — GitHub repository admin access до Actions secrets.

Збірка й перевірки виконуються на NAS Linux у canonical checkout
(`/volume1/homes/vaoferi/Work/8fc8/biosunlocktool`). Робоча станція
(macOS чи Windows) — редактор, SSH-контроль і браузер: `npm install`,
`node build.js` і локальний Pages runtime на станції не є підтримуваним
шляхом. Історична нотатка: раніше на Windows зустрічався обхід із mapped
drive замість UNC-шляху, але причина була саме в запуску збірки на станції,
тому на NAS вона не виникає.

## Локальна перевірка

У корені репозиторію:

```bash
npm install
npm run build
npx wrangler whoami
npx wrangler pages dev . --local --ip 127.0.0.1 --port 8788
```

`build.js` зараз не генерує нові файли й не валідовує DOM: він лише запускає
build-entrypoint, бо всі статичні копії вже закомічені. Якщо shell показує інший working directory,
спочатку перейдіть у корінь репозиторію й повторіть команду.

## GitHub Actions

`.github/workflows/deploy.yml` запускається:

- автоматично на `push` у `main`;
- вручну через GitHub Actions → **Deploy to Cloudflare Pages** →
  **Run workflow**.

Workflow виконує `node build.js`, встановлює Wrangler і запускає
`wrangler pages deploy . --project-name biosunlocktool` з трьома спробами.
Для роботи потрібні repository secrets:

| Secret | Значення |
|---|---|
| `CF_ACCOUNT_ID` | Cloudflare Account ID |
| `CF_API_TOKEN` | API Token із **Account → Cloudflare Pages → Edit** |

Стан на 2026-09-11: останні Actions завершуються Cloudflare API error `10000`
на кроці deploy, тобто секрет `CF_API_TOKEN` треба перевірити або перевипустити
з потрібним Pages permission. Повторний запуск без зміни секрету проблему не
усуває. Значення токенів не зберігаємо в документації, git або shell history.

## Ручний Pages deploy

Ручний deploy дозволений лише після перевірки diff і build:

```bash
git status --short
git diff --check
npm run build
npm run deploy
```

`npm run deploy` — це єдиний npm-скрипт для публікації. Команди
`npm run pages:deploy` у старих нотатках більше не існує.

Якщо local OAuth працює (`npx wrangler whoami` показує правильний account), але
GitHub Actions падає, ручний deploy є тимчасовим operational fallback, а не
заміною виправлення repository secret.

## Custom domains

У Cloudflare Dashboard → **Workers & Pages → biosunlocktool → Custom domains**
мають бути підключені:

```text
biosunlocktool.com
www.biosunlocktool.com
us.biosunlocktool.com
ca.biosunlocktool.com
in.biosunlocktool.com
pl.biosunlocktool.com
de.biosunlocktool.com
af.biosunlocktool.com
```

Для кожного домену перевірте автоматичний SSL і DNS-запис. Не створюйте окремий
Pages project під локаль — host-aware middleware розрахований на одну Pages
публікацію.

## Smoke test після deploy

HTTP 200 сам по собі не є доказом готовності. Перевірте в браузері або через
відповідний runtime smoke test:

1. Відкриття семи market clean root URL і `www` alias без white page.
2. Правильні `lang`, hero copy і market background для кожного host.
3. На India: English default, кнопка Hindi, перемикання назад на English і
   відсутність зміни URL/canonical.
4. На Poland/Germany/Africa: exact `/locales/.../` та `/index.html` paths
   повертають `301` на clean root.
5. Немає horizontal overflow, критичних console errors і mojibake.
6. На mobile, tablet і desktop зберігаються header, hero, cards та якорі.

Приклад перевірки legacy redirect:

```bash
curl.exe -I https://pl.biosunlocktool.com/locales/pl-PL/
curl.exe -I https://de.biosunlocktool.com/locales/de-DE/index.html
curl.exe -I https://af.biosunlocktool.com/locales/af-ZA/
```

Очікується `301` із `Location` на `https://<market>.biosunlocktool.com/`.

## Кеш і версії assets

`_headers` дозволяє edge перевіряти звичайні assets через `etag`, а vendor
бібліотеки кешує immutable. Після зміни shared CSS оновіть
`main.css?v=<новий-штамп>` у всіх landing HTML-файлах; після зміни India toggle
оновіть `india-language.js?v=<новий-штамп>` у root та `locales/en-US`.
Це захищає від старого edge-кешу на custom domains.

## Staging і відкат

NAS preview `http://nlmhelp.keenetic.link:18080/` залишається окремим staging
каналом і не є доказом Cloudflare production стану. Для відкату Pages використовуйте
попередній успішний deployment у Cloudflare Dashboard; не видаляйте assets,
custom domains або `.env`/secrets під час rollback.
