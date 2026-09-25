# Definition of Done — Vaoferi repositories

Цей документ є обов'язковим completion contract для всіх repository-scoped IMPLEMENTATION задач у підключених Vaoferi проєктах.

## 1. Немає "майже готово"

Задача не може перейти в `In Review` або `Done`, якщо після агента лишився будь-який погоджений хвіст: код, тест, lint/typecheck, build, browser/runtime QA, commit, push, remote sync, evidence або acceptance criterion.

Якщо виконання фізично заблоковане зовнішнім фактором, задача лишається `In Progress / BLOCKED` з детальним blocker handoff. Заборонено маскувати незавершену роботу під review-ready.

## 2. Git completion і чистий worktree є обов'язковими

### Preflight: чужі або старі зміни не можна ігнорувати

Перед початком **нової** repository-scoped IMPLEMENTATION задачі агент запускає:

`git status --porcelain=v1 --untracked-files=all`

або canonical helper:

`python .vaoferi/check_worktree_clean.py`

Якщо worktree вже dirty, агент **не має права** просто почати нову задачу поверх нього.

- Кожен pre-existing staged/modified/deleted/renamed/untracked файл треба інвентаризувати й прив'язати до конкретної задачі або джерела.
- Якщо зміни належать незавершеній активній задачі, агент продовжує **саме її** до commit + push + clean worktree, а не відкриває поверх неї інший implementation slice.
- Якщо зміни належать іншій відомій задачі, її треба явно link-нути/відновити й довести до безпечного remote state окремим commit/push перед новим review-ready handoff.
- Якщо ownership неможливо довести без ризику втрати даних, поточна робота лишається `In Progress / BLOCKED`; невідомі зміни не видаляються, не reset-яться і не маскуються.
- Generated/temp garbage, створене поточним агентом і доведено disposable, прибирається до handoff. Чужі або невідомі файли не знищуються заради зеленого status.

### Completion: нуль незакомічених файлів

Перед `In Review` / `Done` для кожної repository-scoped IMPLEMENTATION задачі агент зобов'язаний:

1. перевірити цільовий diff та `git status --porcelain=v1 --untracked-files=all`;
2. commit-нути **всі** безпечно класифіковані project-owned зміни, які мають зберігатися, з коректною issue traceability;
3. push-нути кожен intended commit у reviewer-accessible remote branch/PR;
4. підтвердити, що intended local HEAD == remote branch/PR head;
5. повторно запустити `python .vaoferi/check_worktree_clean.py`;
6. отримати **порожній Git status** і `WORKTREE CLEAN: PASS`;
7. записати exact pushed SHA/PR та clean-worktree evidence у Linear handoff.

У кінці задачі має залишатися **нуль незакомічених tracked/staged/untracked файлів**. Gitignored private/runtime файли не є Git-worktree змінами, але tracked secrets або випадково unignored приватні файли — окрема security failure, не привід їх commit-ити.

Local-only commit не є завершенням. Непушений commit, dirty worktree або невідомий mixed diff блокують `In Review` / `Done`.

## 3. Manual browser QA — affected surfaces × 10 canonical viewport states

Кожна зміна, що може вплинути на rendered UI, layout, responsive behavior, content visibility, interaction, theme, routing або browser/runtime behavior, потребує ручної browser-перевірки всіх affected user-facing surfaces.

Базова матриця має 5 класів екранів у двох орієнтаціях — 10 canonical states на кожну affected сторінку/поверхню:

| Клас | Portrait | Landscape |
|---|---:|---:|
| extra-small / below-common phone | 280×480 | 480×280 |
| normal phone | 390×844 | 844×390 |
| tablet | 768×1024 | 1024×768 |
| desktop | 1440×900 | 900×1440 |
| ultra-wide / extreme large | 2560×1080 | 1080×2560 |

Проєкт може додавати власні breakpoint-critical viewport-и, але не може мовчки скорочувати цю матрицю для UI-змін.

Якщо зміна зачіпає 3 сторінки/кабінети — це мінімум 30 ручних visual checks: 3 affected surfaces × 10 states. Якщо affected surfaces більше — перевіряються всі.

Manual QA виконується на actual reviewer-accessible rendered target, а не за source/DOM-string presence. Для кожного state перевіряються щонайменше:

- усі задекларовані блоки присутні й видимі;
- текст не обрізаний, не виходить за контейнер і не ховається;
- елементи не перекривають один одного;
- spacing/gaps не колапсують до `0`, якщо contract не вимагає full-bleed/touching-edge;
- немає horizontal page overflow;
- controls доступні та не випадають за viewport;
- responsive reflow не губить контент;
- light/dark/system та інші affected states перевірені, якщо зміна їх стосується;
- Console/Network не містять нових критичних помилок, якщо це релевантно.

## 4. Automated responsive/geometry sweep

Manual 10-state matrix не замінює автоматизований browser regression gate.

Для UI/layout/responsive змін проєкт повинен мати Playwright або еквівалентний browser test, який програмно перевіряє геометрію та видимість на діапазоні viewport-ів, включно з breakpoint boundaries і owner-reproduced edge cases.

Для критичних діапазонів дозволено й рекомендовано exhaustive integer sweep по ширині/висоті в bounded range, якщо runtime це практично дозволяє. Якщо повний Cartesian sweep непропорційно дорогий, агент не має права просто пропустити його: він зобов'язаний зафіксувати project-specific sampling strategy, що включає кожен breakpoint boundary (`n-1`, `n`, `n+1`), мінімальні/максимальні висоти, owner-reproduced viewport-и та representative intermediate states.

Автоматизований gate має fail-ити, якщо:

- expected element зник або став non-visible;
- кількість required blocks/controls змінилася без contract change;
- element rect виходить за viewport/approved container;
- sibling blocks overlap;
- required spacing/inset колапсує нижче documented minimum;
- page отримує unexpected horizontal overflow;
- content стає clipped/hidden через responsive rule;
- layout/theme/orientation змінює geometry всупереч contract.

Pixel-diff/screenshot regression може доповнювати geometry assertions, але не замінює semantic/DOM geometry checks там, де потрібно довести видимість, кількість елементів або взаємне розташування.

## 5. Tests and build

Перед `In Review` / `Done` агент запускає всі project-required gates, релевантні зміні: focused regression, lint, typecheck, static/security checks, build, browser/runtime suites та project-specific CI-equivalent commands.

Behavior change / bug fix виконується TDD, якщо test технічно можливий: RED → minimal GREEN → regressions.

Known failure не можна назвати PASS. PRE-EXISTING/UNRELATED, CI/ENVIRONMENT і EXTERNAL failures класифікуються окремо та не маскуються product-fix-ом.

## 6. Evidence handoff у Linear

Repository-scoped IMPLEMENTATION задача не готова до review без короткого evidence ledger:

- `MODE: IMPLEMENTATION`
- `SHA/PR: <exact pushed SHA / PR>`
- `FOCUSED TESTS: PASS`
- `PROJECT GATES: PASS` або `N/A + exact reason`
- `BUILD: PASS` або `N/A + reason`
- `BROWSER/RUNTIME: PASS — <affected surfaces> × <manual states count>`
- `AUTOMATED RESPONSIVE/GEOMETRY: PASS — <command/test>` або `N/A + documented non-UI reason`
- `REMOTE SYNC: PASS`
- `WORKTREE CLEAN: PASS — python .vaoferi/check_worktree_clean.py`
- `KNOWN EXCEPTIONS: none` або explicit accepted exception

Reviewer перевіряє докази незалежно. Missing evidence = FAIL → `In Progress`.

## 7. Project rules можуть тільки посилювати

`PROJECT_RULES.md`, `DESIGN_CONTRACT.md`, `TESTING.md`, SPEC та інші project-owned docs можуть додавати viewport-и, acceptance criteria, security gates, browser engines, ролі, теми, локалізації та production checks.

Вони не можуть послабити цей Definition of Done без explicit owner decision, зафіксованого в canonical docs.

## 8. Принцип

**Зробив задачу — довів її до віддаленої, перевіреної, відтворюваної й незалежно перевіряємої готовності.**

Код без push, UI без browser QA, browser QA без affected-surface matrix, layout без automated responsive geometry regression або task без evidence — це не Done.