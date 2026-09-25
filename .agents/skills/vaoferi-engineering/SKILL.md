---
name: vaoferi-engineering
description: Use for non-trivial implementation, bug fixes, refactors, tests, or engineering documentation when the universal AGENTS core is not enough.
---

# Vaoferi Engineering

## Procedure

1. Прочитай `PROJECT_RULES.md` і релевантні project docs/code перед змінами.
2. Сформулюй user/process outcome і перевір фактичний current behavior.
3. Створи короткий **Acceptance ledger**: кожен релевантний acceptance criterion → test/interaction/evidence, environment і expected observable result.
4. Знайди існуючу реалізацію, contract, native capability або dependency перед створенням нової логіки.
5. Для behavior change або bug fix застосуй TDD: failing test → verify **RED** → minimal implementation → verify GREEN → refactor only while green.
6. Змінюй мінімальну кількість пов'язаних файлів; не роби глобальний replace без target-list review.
7. Запусти релевантні tests/lint/build/runtime/browser checks, потім перевір diff і acceptance ledger.
8. Поясни результат outcome-first; явно назви неперевірене.

## Architecture And Data Flow

- SOLID використовуй як захист від coupling/хаосу, а не як церемонію: interface/service/adapter потрібні лише коли реально зменшують ризик змін або полегшують тестування.
- Якщо однакова логіка повторюється приблизно 3+ рази, перевір, чи спільне виділення справді спростить підтримку; не створюй abstraction лише через число повторів.
- Перед зміною API, schema або data flow знайди consumers і source of truth. Не зашивай у frontend дані, які за задумом належать admin/API/БД.
- Зберігай backward compatibility, коли це практично; якщо contract змінюється навмисно, онови consumers і tests разом.
- Workaround допустимий як явно названий тимчасовий шлях із зрозумілим ризиком і шляхом нормального виправлення, а не як прихований substitute для root cause.

## Tests And CI

- Tests — довготривала частина product code: не видаляй test і не послаблюй assertion лише для того, щоб приховати реальний failure.
- Для critical logic має бути зрозуміло, який user/process flow вона захищає, який test це перевіряє і якою командою його повторити.
- Browser TDD RED має відтворити user-visible failure, а не лише знайти потрібний selector/string у source.
- Для interaction acceptance дійте на actual **topmost user-facing target**. За потреби перевір hit-testing/locator/elementFromPoint; underlying image/node не доводить поведінку верхнього clickable layer.
- `source/string/DOM-presence` assertions можуть доповнювати verification, але не замінюють реальну interaction/runtime перевірку.
- Для UI бери viewport/device matrix з project `TESTING.md`, task acceptance або design contract; перевіряй реальні interactions, **Console/Network**, overflow/layout і relevant states.
- Якщо required browser/runtime недоступний, не маскуй це manual/source check-ом: task лишається **In Progress/BLOCKED**.
- Перед `In Review` exact SHA/version має бути розгорнутий на canonical **reviewer-accessible** artifact/preview, якщо task потребує visual/runtime review; stale preview не рахується.
- Якщо змінюється shared surface, повторно проганяй related acceptance/regression flows, що можуть бути зачеплені.
- Якщо CI існує — не обходь його. Якщо повторювані tests/build gates є, а CI відсутній, запропонуй найменший корисний automation path замість ручного ритуалу.

### Evidence Format

Для нетривіальної/risky роботи фінальний evidence має дозволяти простежити:

`acceptance criterion → test/interaction → environment/artifact/SHA → observed result → PASS/FAIL/BLOCKED`.

“Agent says PASS” без фактичного command/browser/runtime output не є evidence.

### Reviewer handoff

This section is the canonical **reviewer handoff** evidence contract.

Перед передачею в review збережи достатньо evidence, щоб інший агент міг перевірити роботу без довіри до твого висновку.

Якщо був **failed attempt** або task лишається blocked, handoff має явно містити:
- expected outcome;
- actual outcome;
- що саме виконувалось і в якому порядку;
- точні errors/output;
- перевірені files/functions/commits;
- **what was ruled out**;
- наступний найкращий experiment/fix.

Не стискай невдачу до “не вийшло”: невдала спроба — це evidence для reviewer і наступного executor.

## Comments

- Коментуй не очевидний синтаксис, а ризиковий invariant: чому зроблено саме так, що зламається при неправильному спрощенні, і який flow/test це захищає, якщо відомо.
- Не створюй overcommenting; застарілий коментар онови або прибери разом зі зміною поведінки.

## Text And Windows Hygiene

- Текстові файли зберігай UTF-8 без BOM, якщо project не задає інше; після масових текстових змін перевір mojibake.
- Для multilingual/Cyrillic source не роби `bulk rewrite` через shell one-liner/pipeline з неявним encoding. Спочатку зафіксуй target-file list, а для широких замін використовуй editor/file tooling, Python або інший шлях з **явним UTF-8** read/write.
- Після broad text rewrite перевір diff і запусти project mojibake/encoding scan, якщо він існує; за відсутності project check зроби вузький scan типових replacement-character/mojibake patterns у змінених user-facing файлах.
- На Windows для encoding-sensitive читання/запису не використовуй legacy `powershell.exe`, якщо доступні `pwsh`, Python або file tools із явним UTF-8 handling.

## Documentation

- ADR створюй лише для durable/hard-to-reverse architecture or domain decision.
- Не створюй progress logs, дублікати README або документацію, яку ніхто не читає.
- Якщо project already має canonical SPEC/ADR/TESTING format — використовуй його замість нового формату.
