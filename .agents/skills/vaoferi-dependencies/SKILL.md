---
name: vaoferi-dependencies
description: Use when selecting, adding, upgrading, replacing, or troubleshooting version compatibility of dependencies, runtimes, frameworks, SDKs, or tools.
---

# Vaoferi Dependency Freshness

Власник віддає перевагу сучасному стеку і приймає контрольований beta/preview risk, але не некерований production risk.

## Workflow

1. Визнач installed/current relevant versions і project constraints.
2. Перевір актуальні official docs, release/migration notes та security information.
3. Перевір meaningful compatibility chain зазвичай до приблизно 3 рівнів зв'язків навколо змінюваної dependency.
4. Якщо бажана свіжа версія потребує невеликого coherent related update set (орієнтир: приблизно 5 packages або менше), віддавай перевагу узгодженому оновленню, якщо rollback і verification керовані.
5. Beta/preview/current-edge — допустимі кандидати, а не автоматичний reject. Вибирай їх, коли benefit зрозумілий, support достатній, risk контрольований, rollback/isolation практичний.
6. Не перетворюй локальний dependency update на неузгоджену major stack migration.
7. Тестуй отриманий dependency set цілком, а не лише одну requested package.
8. Перед riskier upgrade явно зафіксуй rollback path і project-specific breakpoints.

Якщо project rules вимагають конкретної stable/pinned версії, project constraint має пріоритет до окремого рішення власника.
