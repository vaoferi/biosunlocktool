---
name: vaoferi-task-tracking
description: Use when reading, migrating, creating, updating, or retiring work items across Linear and legacy Trello so there is only one active source of truth.
---

# Vaoferi Task Tracking

## Invariant

`Linear` — єдине активне джерело робочих задач. `Trello` — тимчасове legacy input для міграції, не planner і не довгостроковий archive.

`DEFINITION_OF_DONE.md` — обов'язковий centrally-owned completion contract для кожної repository-scoped IMPLEMENTATION задачі. Цей skill уточнює lifecycle, але не може послабити DoD.

## Mandatory issue modes

Перед execution кожна картка має бути однозначно віднесена до одного mode. Якщо mode не вказаний у title/description/template, агент визначає його перед роботою й фіксує одним рядком у Linear.

1. **IMPLEMENTATION** — змінює code/config/content або інший releaseable behavior.
2. **DISCOVERY / INTAKE** — research, audit, збір вимог, visual approval або рішення; `Done` означає завершений deliverable, але не shippable code.
3. **RELEASE / DEPLOY** — доставляє вже прийнятий candidate; не є фазою ремонту історичного backlog.

`Done` має різну семантику тільки відповідно до mode; `DISCOVERY / INTAKE Done` ніколи не можна трактувати як release-ready implementation.

## IMPLEMENTATION hard completion loop

Перед execution прочитай `DEFINITION_OF_DONE.md` і project-owned `PROJECT_RULES.md`/`TESTING.md`/design contracts, релевантні задачі.

Перед **новою** IMPLEMENTATION задачею виконай `python .vaoferi/check_worktree_clean.py` або exact `git status --porcelain=v1 --untracked-files=all`. Якщо є pre-existing dirty state, не ігноруй його і не починай поверх нього новий slice: визнач owning task, доведи його до commit + push + `WORKTREE CLEAN: PASS`, або залиш нову роботу `In Progress / BLOCKED`. Невідомі зміни не reset/delete.

Після execution intent агент продовжує IMPLEMENTATION task самостійно до повного Definition of Done; **не зупиняйся після коду**, локального вигляду або довгого звіту в очікуванні, що owner окремо нагадає про lint/tests/build/browser QA/commit/push.

До `In Review` / `Done` виконай усе applicable для цього slice:

1. реалізуй requested scope без silent scope creep;
2. проганяй focused regression/tests для зміненого behavior;
3. проганяй project-required lint/typecheck/static/security gates, релевантні цьому slice;
4. зроби build, якщо зміна впливає на buildable artifact;
5. для UI/layout/responsive/browser змін вручну перевір **кожну affected user-facing surface × 10 canonical viewport states** з `DEFINITION_OF_DONE.md`, плюс project-specific states;
6. для UI/layout/responsive змін проганяй automated browser geometry/visibility regression gate з breakpoint boundaries та owner-reproduced edge cases;
7. виконай інший relevant browser/runtime verification для browser/runtime-dependent behavior;
8. перевір diff на unintended edits, secrets, generated garbage, незрозумілі untracked/modified хвости і випадкові dependency/config зміни;
9. виправ failures, якщо вони спричинені цією карткою;
10. commit із issue reference;
11. push;
12. підтвердь **REMOTE SYNC**: intended local HEAD == remote branch/PR head;
13. запусти `python .vaoferi/check_worktree_clean.py` і отримай `WORKTREE CLEAN: PASS`;
14. запиши exact pushed SHA і короткий evidence handoff у Linear.

IMPLEMENTATION не може бути `In Review` або `Done`, якщо її required gates, affected-surface browser matrix, automated responsive/geometry gate, build/runtime evidence, clean intended diff, commit, push або REMOTE SYNC ще попереду.

## Failure classification before product changes

Кожне падіння gate спочатку класифікуй. Не змінюй product code лише тому, що щось червоне.

- **CARD REGRESSION** — спричинено current card diff → виправ у цій картці; `Done` заборонений до PASS.
- **PRE-EXISTING / UNRELATED** — існувало до current diff або поза scope → не ремонтуй мовчки; створи/link follow-up, доведи що current card не погіршує стан, і не тягни цей борг у release без причини.
- **CI / ENVIRONMENT** — missing browser/action/font/filesystem/runtime mismatch або harness problem → виправляй інфраструктуру в окремому scope; не підганяй product CSS/logic без доказу product regression.
- **EXTERNAL** — CDN/API/provider/network → isolate/fail fast за project contract; не переписуй продукт навмання.

## No report-and-wait default

Після команди «виконай картку» агент не робить часткову роботу й не чекає другого owner prompt на тести, browser QA, commit, push або доробку.

Очікування owner допустиме лише коли потрібна реальна owner-only дія/рішення, наприклад:

- неоднозначний visual/product acceptance;
- destructive/high-risk mutation, для якої project policy вимагає approval;
- credential/provider action, доступний лише owner;
- зовнішній blocker, який неможливо обійти без зміни scope/requirements.

У такому разі дай один конкретний blocker + одну потрібну owner action. Не маскуй pending work у великому звіті.

## Evidence contract

Успішний IMPLEMENTATION handoff має містити короткий machine-readable блок:

- `MODE: IMPLEMENTATION`
- `SHA/PR: <exact pushed SHA / PR>`
- `FOCUSED TESTS: PASS`
- `PROJECT GATES: PASS` або `N/A + reason`
- `BUILD: PASS` або `N/A + reason`
- `BROWSER/RUNTIME: PASS — <affected surfaces> × <manual states count>` або `N/A + documented non-UI reason`
- `AUTOMATED RESPONSIVE/GEOMETRY: PASS — <command/test>` або `N/A + documented non-UI reason`
- `REMOTE SYNC: PASS`
- `WORKTREE CLEAN: PASS — python .vaoferi/check_worktree_clean.py`
- `KNOWN EXCEPTIONS: none` або explicit accepted exception

Missing field/evidence для applicable gate = FAIL → задача лишається `In Progress`.

DISCOVERY / INTAKE handoff:

- `MODE: DISCOVERY`
- `DELIVERABLE:`
- `DECISION / OPEN QUESTIONS:`
- `IMPLEMENTATION ISSUE: <id>` або `none`
- `SHIPPABLE CODE: NO`

RELEASE / DEPLOY використовує `vaoferi-deploy` і не має автоматично ремонтувати PRE-EXISTING / UNRELATED debt.

## Trello → Linear Procedure

1. Не створюй нову work card у Trello.
2. Не запускай окремий повний sweep дошки Trello без прямого запиту власника. Очищай Trello інкрементально в межах поточної роботи.
3. Коли релевантна Trello card з'являється в роботі, прочитай її повністю: description, comments, checklists, attachments/context якщо доступні.
4. Перенеси кожну ще корисну незавершену дію в Linear або в уже існуючу Linear issue.
5. Durable facts/decisions, яким не місце у task tracker, перенеси в canonical docs/tests/code comments лише коли це правильний long-term source.
6. Перевір parity: у Trello не залишилось унікальної корисної інформації чи незавершеної роботи.
7. Після parity спробуй hard-delete card, якщо доступний інструмент це підтримує.
8. Якщо hard-delete недоступний, архівуй/закрий card і вважай Trello-side cleanup завершеним для поточної роботи; не створюй окремий blocker лише заради фізичного delete.
9. У Linear зафіксуй migration destination/evidence настільки коротко, наскільки потрібно для traceability.

Не роби bulk-delete або bulk-archive без вичитки. Мета — поступово прибрати Trello з активного процесу без silent loss і без окремого проєкту з очищення дошки; історія, яку справді треба зберегти, має жити в Linear або canonical docs/tests, а не в Trello.

## Executor → Reviewer Protocol

### Status semantics

- `In Progress` = work is being implemented, diagnosed, or is blocked.
- `Ready for Review` is the handoff state represented by Linear `In Review`.
- For every repository-scoped task, `Ready for Review` requires **commit + push** and the exact **pushed SHA** in the Linear handoff. A local-only commit is not reviewable evidence.
- Never move a failed/blocked task to `In Review` just to attract help.
- `Done` = independent review evidence satisfies every relevant acceptance criterion and no owner-only gate remains.
- If owner visual/business approval is still required, reviewer may record technical PASS but the issue remains `In Review`.

### Executor handoff

A success handoff must include:

1. user/process outcome;
2. changed files and branch/commit/PR;
3. exact remote branch/PR and **pushed SHA**; verify the commit exists on the remote before handoff;
4. acceptance ledger;
5. commands/tests/browser/runtime checks with exact observed results, including affected-surface × viewport evidence when applicable;
6. reviewer-accessible artifact/URL + exact SHA/version where relevant;
7. known risks and anything unverified;
8. exact owner action still required, if any.

Definition of Done stays outcome-first and in user language. Technical evidence may name functions, files, APIs, selectors, commands, commits and logs.

For a repository-scoped Linear task, the commit/push rule is unconditional at handoff:
- implementation/change task → commit intended changes and push;
- verification/no-code task → create and push an explicit task evidence commit when no file delta exists, so reviewer still has remote traceability;
- if push is impossible, task stays `In Progress/BLOCKED` and must not be presented as review-ready.

### Blocked handoff

A **Blocked handoff** must be more detailed than a success handoff. Preserve failed attempts as diagnostic evidence instead of compressing them away.

Required fields:

- `BLOCKED ON`
- expected outcome
- actual outcome
- exact reproduction
- confirmed root cause or current root-cause hypothesis
- `WHAT WAS TRIED` in chronological order
- commands/tools/environment used
- exact errors/output/evidence
- files/functions/commits inspected
- **what was ruled out**
- next recommended experiment/fix
- whether another agent can continue without owner input
- exact owner action only when physically required

Do not write “could not finish” without the failed attempt trail. The reviewer should be able to understand what the executor tried, why it failed, and where to continue without repeating the same blind path.

## Independent Reviewer Protocol

### Candidate selection

Each reviewer run handles **one issue per run**.

Use **blocked-first** selection:

1. blocked / explicitly failed `In Progress` work needing reviewer diagnosis;
2. then `In Review`;
3. inside each bucket: `Urgent` → `High` → `Medium` → `Low`;
4. tie-breaker: **oldest waiting first**.

A blocked issue is more urgent для reviewer than an ordinary `In Review` issue because the executor cannot progress.

### Mandatory review cycle

Do not trust the executor comment as proof. Build a fresh acceptance → evidence ledger and use the available stack:

- **Linear**: read issue description, comments, relations, labels/status, owner decisions and prior failed attempts. Write the final review comment/state here.
- **GitHub**: inspect relevant repository, exact commits/diff, current source and tests. Do not infer implementation from a handoff summary.
- **Opera Browser Connector**: for user-visible behavior, exercise the live/reviewer artifact when accessible; also inspect the project filesystem when the connector exposes exact file URLs/paths. Prefer concrete links/known paths; never guess a filesystem location.
- **Context7**: always perform a relevance check. If the verdict depends on framework/library/API/version-sensitive behavior, fetch current official documentation before deciding.
- **Superpowers**: mandatory process layer. At minimum use `using-superpowers` and `verification-before-completion`; for blocked/failing behavior also use `systematic-debugging`.

Owner-requested helper preflight:

- **Wayfinder**
- **I have ADHD**

Attempt to resolve/invoke those exact helpers when the harness provides them. If they are unavailable, say so explicitly in reviewer evidence; never pretend they ran. Their absence does not replace the mandatory Linear/GitHub/Opera/Context7/Superpowers evidence cycle.

For UI/interaction acceptance, act on the actual **topmost user-facing target**. Source/string/DOM-presence checks can support a verdict but cannot substitute for real behavioral evidence when that evidence is required.

### Reviewer outcomes

For blocked work:
- diagnose root cause as far as evidence allows;
- point to the likely file/function/flow only when supported;
- give concrete next steps that avoid repeating failed attempts;
- keep the issue `In Progress` unless the reviewer actually completes and re-verifies the implementation under the project contract.

For `In Review`:
- first verify the executor's **pushed SHA** exists on the remote and matches the described task scope; missing/unpushed SHA = FAIL → `In Progress`;
- verify `DEFINITION_OF_DONE.md` evidence independently, including affected-surface browser matrix and automated responsive/geometry gate when applicable;
- independent FAIL → detailed review comment + `In Progress`;
- technical PASS but owner-only visual/business acceptance still pending → keep `In Review`, state exact owner action;
- full PASS with no owner-only gate → `Done`.

Never auto-delete Linear issues from the reviewer loop. Issue retention/archive is a separate policy. Historical evidence is valuable for debugging recurring failures.
