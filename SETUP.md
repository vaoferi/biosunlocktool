# 🚀 Запуск бою: biosunlocktool.com на Cloudflare Pages

> Оновлено 2026-09-09. Два ручні кроки у вебі — і далі сайт оновлюється сам з кожним пушем у `main`.

## Поточний стан

- ✅ Канонічна сторінка (en-US) лежить у корені репо (`index.html` + `assets/`) — це те, що бачить `biosunlocktool.com`;
- ✅ `locales/<locale>/` — місце майбутніх мовних копій; `in/de/pl/af` поки заглушки;
- ✅ GitHub Action `.github/workflows/deploy.yml` деплоїть на Pages при кожному пуші в `main`;
- ✅ `functions/_middleware.ts` роутить субдомени `in./de./pl./af.` на свої локалі.

## Крок 1 — секрети GitHub (1 хв)

1. Відкрий `github.com/vaoferi/biosunlocktool/settings/secrets/actions`
2. Додай:
   - `CF_ACCOUNT_ID` → твій Account ID (dash.cloudflare.com → праворуч на Overview);
   - `CF_API_TOKEN` → створи токен із правами **Account → Cloudflare Pages → Edit**.

## Крок 2 — перший деплой (1 клік)

1. GitHub → **Actions** → «Deploy to Cloudflare Pages» → **Run workflow** (гілка `main`).
2. Дочекайся зеленої галочки — у Cloudflare з'явиться Pages-проєкт **`biosunlocktool`** (Action створює його сам, у Dashboard нічого створювати не треба).

## Крок 3 — домени (після першого деплою)

1. Dashboard → Workers & Pages → проєкт **biosunlocktool** → **Custom domains** → Set up a custom domain.
2. Додай: `biosunlocktool.com`, `www.biosunlocktool.com`, `in.`, `de.`, `pl.`, `af.biosunlocktool.com`.
3. Домен уже в Cloudflare DNS → сертифікат видасться автоматично; CNAME-записи створяться самі.

## Крок 4 — SSL

Dashboard → SSL/TLS → Overview → **Full (strict)**.

## Як оновлювати сайт

Пуш у `main` = автодеплой (1–2 хв). Ручний варіант: `npx wrangler pages deploy . --project-name biosunlocktool`.

## Захисні правила

- **NAS-прод `http://nlmhelp.keenetic.link:18080/` не прибирати** — лишається staging, поки Pages не прийме трафік (ADR у `nexxgsm-design/docs/architecture-decisions.md`).
- Канон живе в `nexxgsm-design/versions/en-US-landing/`; цей корінь і `locales/en-US/` — його **деплой-копії**. Зміни робити в каноні й копіювати сюди (поки не вирішено питання про автосинхронізацію — відкрите питання в ADR).

## Відкриті питання

- Чи `nexxgsm-design` переїжджає в це монорепо, чи канон залишається в двох місцях з ручним копіюванням — рішення не ухвалене (див. ADR).
- Точна поведінка апекса і www (редірект/канонічний хост) — уточнити при підключенні доменів.
