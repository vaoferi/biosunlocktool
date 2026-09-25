---
name: vaoferi-security
description: Use for secrets, credentials, authentication, authorization, permissions, privacy, exposed data, security-sensitive configuration, or destructive security remediation.
---

# Vaoferi Security

## Practical Local Secret Policy

### Canonical two-copy model

Working secret values use exactly **two controlled canonical copies**:

1. **Vaultwarden** — the global credential inventory/backup for all projects and infrastructure. Every validated working credential belongs here, even if it is unrelated to the current project.
2. **project-root `.env`** — the local working copy containing only credentials actually required by that project.

Do not create a third canonical secret-value store. `.env.example`, docs and inventories may contain variable names, account/service names and Vaultwarden references, but never the secret value.

A project-root `.env` is an approved normal working store when it is private to the intended workspace and ignored by Git. Agents may read and use it when the task needs the credential and tool access permits it.

### Working credential discovery

A **working credential** is a password/token/API key/SSH credential/etc. that the agent has actually validated against the intended service or successful task flow, not merely a string that looks secret.

When a working credential is discovered in source files, configs, old notes, local files, runtime configuration, deployment scripts or another accessible location:

1. identify what service/account it belongs to;
2. determine whether the **current project** needs it;
3. if current project needs it → persist/sync to **BOTH** Vaultwarden and project-root `.env`;
4. if current project does not need it → persist/sync to **Vaultwarden only**;
5. **не чекати**, що owner повторно надасть working credential, який agent already found and validated;
6. **не echo** secret values into chat, Linear, Trello, docs, screenshots, logs, tests or commit messages.

If Vaultwarden already has a different value, do not blindly destroy history or the known-working value. Verify which credential currently works for the intended consumer, then reconcile the Vaultwarden record and project `.env` so the active working value is recoverable.

For multiline credentials such as an SSH private key, preserve the two-copy rule. Use a lossless `.env` representation compatible with the project (for example a base64 value) rather than inventing a third permanent secret store. A temporary runtime file may be materialized with strict permissions when a client requires a file path, but it is not a third canonical store.

### Vaultwarden access unavailable

If the harness/CLI cannot write Vaultwarden:

- do not claim Vaultwarden persistence succeeded;
- when the credential belongs to the current project, preserve the validated working value in the ignored project-root `.env`;
- leave an explicit BLOCKED/follow-up with only non-secret destination metadata: service/account name, Vaultwarden folder/item naming target and required owner/tool action;
- when the credential does not belong to the current project, Vaultwarden persistence remains incomplete until access exists; never leak the value into Linear/chat as a workaround.

### Exposure versus availability

Finding a validated credential in tracked/shared/public code is still a security exposure.

Preserve availability first according to the two-copy model, then flag exposure/rotation work. Do not silently delete, blank or rotate a credential before its consumers and rollback path are understood.


## Hard Boundaries

- Do not commit or intentionally track a real `.env`/credential file. Safe examples/templates are allowed.
- Do not bundle local secrets into public/shared artifacts or copy them to a deployment target unless that runtime explicitly requires its own protected server-side configuration.
- Do not expose secret values in chat, issues, Linear, Trello, docs, logs, screenshots or tests without a concrete unavoidable need.
- If a credential was committed to a public/shared repository, published, logged to an untrusted/shared system, or otherwise actually exposed, treat that as a real incident; deleting the latest copy alone is not enough.
- For an exposed credential, rotation/revocation may be required, but destructive credential actions still need the appropriate authorization and consumer/rollback checks.
- Do not rewrite Git history, delete production data or change auth/permissions destructively without explicit approval and a rollback plan.

## Verification

- For local secret stores, verify the file is ignored/untracked (`git check-ignore` / `git status` / equivalent) rather than deleting it.
- When relevant, verify deploy/package tooling does not accidentally include the local secret file.
- Secret scanners and failure output must report path + rule/class, never the secret value itself.
- After real exposure remediation, verify the active credential/config still works and the exposed value is no longer valid when rotation was in scope.
