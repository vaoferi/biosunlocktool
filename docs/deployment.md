# Cloudflare Pages deployment runbook

Цей документ є коротким operational доповненням до [SETUP.md](../SETUP.md).
Він фіксує порядок перевірки, публікації та smoke test для одного Pages
project `biosunlocktool`.

## 1. Що саме публікується

- Cloudflare Pages root — статичний репозиторій із `index.html`, `assets/`,
  `locales/` і `functions/`.
- Host-aware middleware залишає `biosunlocktool.com`, `us`, `ca` та `in` на
  root landing, а `de`, `pl`, `af` обслуговує внутрішніми locale assets.
- `canonical` та `og:url` для всіх market pages —
  `https://biosunlocktool.com/`.
- `locales/en-IN/index.html` не входить у production routing; India Hindi — це
  client-side toggle в shared English landing.

## 2. Preflight

Запускайте з кореня репозиторію:

```bash
git status --short
git diff --check
npm run build
```

Переконайтеся, що в diff немає `.env`, токенів, cookies, dump-файлів або
випадкових build-артефактів. `npm run build` зараз не створює окремий `dist` і
не перевіряє DOM: усі файли, які Pages віддає, вже лежать у репозиторії, тому
runtime smoke test обов'язковий.

Якщо зміна починалася в canonical workspace, перед цим кроком синхронізуйте
`nexxgsm-design/versions/en-US-landing/` у корінь CF-репозиторію та
`locales/en-US/`. Перевірте, що не пропущені нові CSS/JS/favicon/preload файли,
canonical/OG URL і cache-busted query stamps.

## 3. Прямий deploy

Для локальної авторизації й публікації:

```bash
npx wrangler whoami
npm run deploy
```

`npm run deploy` виконує `wrangler pages deploy . --project-name biosunlocktool`.
Після завершення перевірте deployment у Cloudflare Dashboard і лише потім
переходьте до browser smoke test.

## 4. GitHub Actions

`.github/workflows/deploy.yml` запускає `node build.js`, встановлює Wrangler і
деплоїть із retry (до трьох спроб). Trigger-и: push у `main` та
`workflow_dispatch`.

Необхідні secrets:

| Secret | Необхідна властивість |
|---|---|
| `CF_ACCOUNT_ID` | Account ID цільового Cloudflare account |
| `CF_API_TOKEN` | **Account → Cloudflare Pages → Edit** |

Остання перевірка 2026-09-11: Actions доходять до Pages API, але отримують
`Authentication error [code: 10000]`. Це означає, що repository secret не має
чинної автентифікації або достатнього permission. Retry не виправляє такий
стан; після оновлення secret workflow треба запустити вручну й перевірити зелений
результат.

## 5. Smoke test

Перевіряйте не тільки HTTP status, а фактичний DOM/runtime у браузері:

| Перевірка | Очікування |
|---|---|
| сім market root доменів + `www` alias | сторінка не порожня, правильний hero і market theme |
| `lang` | `en-US`, `pl-PL`, `de-DE`, `en-ZA` за host |
| India toggle | English default → Hindi → English, URL і canonical незмінні |
| legacy locale document path | `301` на clean regional root |
| layout | немає horizontal overflow на mobile/tablet/desktop |
| console | немає критичних JS errors |
| encoding | немає mojibake або пропущених перекладів |

Legacy redirect можна перевірити так:

```bash
curl.exe -I https://pl.biosunlocktool.com/locales/pl-PL/
curl.exe -I https://de.biosunlocktool.com/locales/de-DE/index.html
curl.exe -I https://af.biosunlocktool.com/locales/af-ZA/
```

Очікуйте `301` із `Location` на clean root субдомену.

## 6. Кеш і rollback

Звичайні assets мають `must-revalidate`, vendor — довгий immutable cache. При
зміні shared CSS оновлюйте `main.css?v=...` у всіх landing HTML-файлах; при
зміні India language script — `india-language.js?v=...` у root і `locales/en-US`.

Для rollback оберіть попередній успішний Pages deployment у Dashboard. Не
видаляйте custom domains, uploads/assets чи secrets. NAS preview
`http://nlmhelp.keenetic.link:18080/` є окремим staging і не замінює production
smoke test.
