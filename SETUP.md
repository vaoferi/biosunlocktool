# 🚀 Швидка інструкція: створення Pages проєкту

## Крок 1: GitHub Secrets
1. Перейди в `github.com/vaoferi/biosunlocktool/settings/secrets/actions`
2. Додай секрети:
   - `CF_ACCOUNT_ID` → `ad170d773e79a037e28f4530fd5305a5`
   - `CF_API_TOKEN` → новий токен з правами `Pages:Edit`

## Крок 2: Створення Pages проєкту
1. [Cloudflare Dashboard → Workers & Pages → Create application](https://dash.cloudflare.com/ad170d773e79a037e28f4530fd5305a5/workers-and-pages/create)
2. Обери **"Pages"**
3. **Select a repository** → `vaoferi/biosunlocktool`
4. **Build settings**:
   - Build command: порожньо
   - Build output directory: `.`
5. **Save and Deploy**

## Крок 3: Домени (після створення)
1. **Custom domains** → додай:
   - `biosunlocktool.com` (root)
   - `www.biosunlocktool.com`
   - `in.biosunlocktool.com` → роутить на `locales/en-IN/`
   - `de.biosunlocktool.com` → роутить на `locales/de-DE/`
   - `pl.biosunlocktool.com` → роутить на `locales/pl-PL/`
   - `af.biosunlocktool.com` → роутить на `locales/af-ZA/`

## Крок 4: SSL
1. **SSL/TLS → Overview → Full (strict)**

## Автоматичний деплой
Після пуша в `main` GitHub Action автоматично деплоїт твій сайт на Cloudflare Pages.

---
⏱️ Час виконання: 3-5 хвилин твого часу.
