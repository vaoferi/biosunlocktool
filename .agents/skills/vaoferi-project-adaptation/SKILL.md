---
name: vaoferi-project-adaptation
description: Use when adopting Start Here in an existing repository, reconciling legacy instructions/docs, or when current project rules are duplicated, stale, nested, or conflicting. Preserve useful project knowledge before cleanup.
---

# Vaoferi Project Adaptation

Purpose: adapt an existing repository to the Vaoferi universal baseline **without erasing project knowledge or silently choosing between conflicting rules**.

Canonical lifecycle:

```text
inventory -> classify -> conflicts -> owner decisions -> migrate -> machine-enforce -> parity -> cleanup -> verify
```

**No silent rule loss.** Bootstrap/sync installs the universal baseline; adaptation decides what existing project knowledge must survive and where it belongs.

## 1. Inventory Recursively

Inspect the whole relevant tracked tree, not only repository root. Prefer repository-aware discovery (`git ls-files`, code search, file tools) over a shallow directory glance.

Look for, as relevant:

- root and nested `AGENTS.md`;
- `PROJECT_RULES.md`, `README*`, `CONTRIBUTING*`;
- `CLAUDE.md`, `.gemini_rules.md`, Cursor/provider rules and local overlays;
- `DESIGN*`, product docs, architecture/ADR docs, runbooks, testing/deploy/migration docs;
- `SPEC*`, `TASK*`, `PLAN*`, `WIP*`, checklists and status docs;
- `.github/**`, `.claude/**`, `.kiro/**`, `.agents/**`, `.codex/**` and other hidden tooling docs/config;
- code/tests/config that encode durable invariants more accurately than prose.

Do not assume a familiar basename has only one copy. Search recursively for duplicate governance/documentation names and trace inbound references before cleanup.

If task-like legacy sources are found, route active-work migration through `vaoferi-task-tracking`; project adaptation itself does not invent a second task tracker.

## 2. Classify Every Meaningful Rule

For each unique rule/fact, record one disposition:

- `UNIVERSAL_CORE` — belongs in canonical root `AGENTS.md`.
- `UNIVERSAL_CONDITIONAL` — reusable but only for a task class; belongs in a focused Vaoferi skill.
- `DESIGN` — belongs in canonical `vaoferi-design-skill`, not in generic project rules.
- `PROJECT_SPECIFIC` — remains local in `PROJECT_RULES.md` or an appropriate project-owned doc.
- `PROVIDER_OVERLAY` — provider-specific behavior/config only; keep the overlay thin.
- `MACHINE_ENFORCEABLE` — prefer lint/test/CI/hook once the rule is stable and deterministic.
- `DUPLICATE` — same rule already has a canonical destination; remove duplicate only after parity/reference checks.
- `CONFLICT_REQUIRES_REVIEW` — sources disagree in a meaningful way; owner decision required.
- `DELETE_CANDIDATE` — no unique useful content remains, but deletion still waits for the cleanup gate.

Useful evidence form:

```text
source -> disposition -> destination -> verification -> safe to retire?
```

Do not classify a rule universal merely because it appears in several repositories; ask whether it is actually reusable across projects without importing project facts.

## 3. Resolve Conflicts Explicitly

Do not silently pick the newest file, root-most file, longest file, or a source that merely looks more official.

First establish the factual current state from code/config/tests/runtime where possible. Then present the unresolved owner decision compactly:

**Рекомендую:** Variant A — why it best fits current evidence/project goal.

**Альтернатива:** Variant B — consequences/trade-off.

**Компроміс:** only when a real hybrid is coherent.

After the owner decides:

1. write the canonical choice to the correct destination;
2. update consumers/references/tests when needed;
3. remove or demote the superseded active instruction so both variants do not remain authoritative.

Low confidence is not permission to delete. Keep the source and mark the conflict unresolved until evidence or owner decision closes it.

## 4. Evidence And Source Precedence

Treat sources by what they can prove, not by age alone:

1. current code/config/tests and verified runtime evidence establish what the system actually does;
2. current project-owned rules/ADR/runbooks establish intended durable behavior;
3. Linear establishes active planned work;
4. history / project logs explain **why** a decision was made and are evidence, not automatic current authority;
5. old SPEC/Trello/provider notes are legacy inputs to reconcile, not parallel sources of truth.

A historical record may reveal an invariant that must be preserved, but do not resurrect stale implementation solely because history mentions it.

## 5. Migrate To The Right Destination

Keep universal and project-owned concerns separate:

- universal owner behavior -> canonical Start Here;
- conditional engineering/security/dependency/task procedure -> relevant Vaoferi skill;
- UI/design doctrine -> canonical Vaoferi Design Skill;
- project topology, languages, domains, runtime/deploy/data invariants -> project `PROJECT_RULES.md` or focused project docs;
- deterministic repeatable rule -> machine enforcement when practical;
- provider syntax/capability -> thin provider overlay.

Do not overwrite a working `PROJECT_RULES.md` with a generic template. Merge only confirmed project facts and remove duplicates after destinations exist.

## 6. Tool And Provider Discovery

Tool/provider topology is version-sensitive. Before changing IDE/MCP/provider configuration because a tool appears missing:

1. inspect what tools/connectors are actually available in the current environment;
2. inspect current project/provider config and documentation;
3. distinguish conversation/session availability from repository configuration;
4. change config only when evidence shows the project configuration is actually wrong or intentionally being migrated.

Do not revive historical tool names, ports, commands or provider layouts as universal rules.

## 7. Machine-Enforce Stable Invariants

When a rule is objective and repeatedly important, prefer a small test/lint/CI check over prose-only repetition. Good candidates include:

- canonical path existence;
- duplicate active governance files;
- encoding/BOM policy;
- manifest/hash drift;
- forbidden tracked secret-file classes;
- project-specific port/path/language invariants when a deterministic check exists.

Do not machine-enforce subjective product/design judgement as a brittle string check merely because automation is possible.

## 8. Cleanup Gate

A legacy source can be removed only when all applicable conditions are true:

1. every unique useful rule/fact is classified;
2. retained content has an explicit destination;
3. meaningful conflicts are resolved or deletion is blocked;
4. machine-enforceable rules have their enforcement artifact when that migration is part of scope;
5. project-specific facts remain available locally;
6. inbound/outbound references are updated or intentionally retired;
7. parity/diff/reference checks show no silent loss;
8. the live documentation map/router is updated when the project has one.

Git history is sufficient historical storage for superseded execution/governance text unless a durable project reason requires a current historical document.

Never use broad `clean`, blind overwrite or mass deletion as a substitute for this gate.

## 9. Verify

Before calling adaptation complete:

- run Start Here `verify`;
- run project-owned documentation/topology checks when present;
- run the smallest relevant project tests/lint/build gates affected by changed rules/tooling;
- inspect changed-file list and diff;
- confirm no centrally-owned file was manually forked;
- confirm project-owned rules still contain required local invariants;
- report unresolved sources/risks explicitly.

Final report should state what was migrated, what remained project-owned, what was removed, what conflicts were decided, and which checks proved the result.
