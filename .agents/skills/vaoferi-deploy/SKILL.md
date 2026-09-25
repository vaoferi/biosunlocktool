---
name: vaoferi-deploy
description: Use for production deploys, release publication, rollback, production cutover, CDN/origin validation, deploy credentials/config, or any task where an artifact must become the live user-facing system.
---

# Vaoferi Deploy

Production publication is a separate engineering problem from build success.

**Core principle:** a deploy is complete only when the exact reviewed candidate is proven to be the system the user actually reaches.

Use project-owned deploy/runbook facts first. This skill supplies the universal process and failure boundaries; it never invents project-specific domains, roots, providers, ports, credentials, atomicity, or transport.

## Release scope boundary

Deploy assumes **implementation cards are already complete** under `vaoferi-task-tracking`: their own applicable tests/build/runtime evidence, commit, push and remote sync were finished before release. **do not repair unrelated historical debt** during a deploy merely because a broad release gate exposes it.

Classify any newly observed failure before changing product code:

- release/candidate regression or true hard safety blocker → remains in release scope;
- **PRE-EXISTING / UNRELATED** → create/link follow-up and continue unless it truly blocks safe publication;
- **CI / ENVIRONMENT** → fix the harness/infrastructure in its own scope; do not tune product behavior to satisfy a broken environment without proof;
- **EXTERNAL** → isolate/fail fast according to the project contract; do not rewrite the product blindly.

For an already-green frozen candidate, routine production publication should normally finish in roughly **5–10 хвилин**. If that is impossible, fail fast in that window with one factual hard blocker and the exact required next action; do not silently expand the release into hours of backlog repair.

## Capability preflight

Before a long deploy session, prove the required capabilities exist.

Check early:

- current repository rules and the one canonical project-owned deploy/runbook surface;
- exact Git branch/remote and that the intended **exact pushed SHA** exists remotely;
- build/runtime authority for this project;
- required shell/runtime/provider/transport tooling;
- browser runner required for acceptance;
- access to the production provider and deploy channel;
- credential names expected by the deploy adapter;
- rollback mechanism;
- reviewer-accessible preview/runtime when the project requires one.

If a required browser binary, CLI, provider session, credential store, or transport is unavailable, discover that **before** spending hours building a candidate.

Do not improvise a second deployment path merely because the canonical one is inconvenient. If the project has no deploy contract, define one before write-capable production work.

## Candidate identity

Never deploy “whatever is in main” or “the latest build” without identity.

Before production mutation record:

- exact pushed SHA / reviewed release ref;
- exact artifact path or immutable release id;
- artifact manifest/hash when practical;
- build/runtime environment that produced it;
- included Linear issues / release scope;
- unfinished or explicitly excluded slices;
- reviewer-accessible preview identity.

A local-only commit or an unversioned directory is not a production candidate.

If user-visible work in the candidate is still unaccepted, either finish/accept it or deliberately construct a safe candidate that excludes it. Do not silently ship unfinished work because it happens to be in the branch.

## Config and secrets contract

Follow `vaoferi-security`.

- Vaultwarden is the global credential inventory/backup.
- project-root `.env` is the project-local working secret store.
- repository examples/docs contain variable names only.
- deploy config and its credential-free example must agree on required variable names.
- validate presence/schema **without printing values**.
- build-time environment must be part of candidate identity when it can change public behavior.
- when checking a production/build token or key, prefer boolean presence or opaque MATCH/MISMATCH evidence instead of logging the value.

Do not silently downgrade to a weaker transport. Prefer the strongest project/provider-supported authenticated channel. If only plain FTP is available and the project has not already accepted that risk, require an explicit project/owner decision before transmitting production credentials.

Never paste secrets into Linear, chat, commit messages, screenshots, URLs or logs.

## Target identity before mutation

A writable remote path is not automatically the live production root.

Before upload/write:

1. establish production domain/provider/site identity from project-owned facts;
2. establish the effective document root/runtime target from provider/runtime evidence;
3. establish what root/path the deploy transport will actually mutate;
4. prove those identities map to the same intended target using the strongest available read-only mechanism:
   - provider API/control-plane metadata;
   - stable non-secret remote-root identity marker;
   - known existing entrypoint/file identity;
   - exact path/listing comparison;
   - other project-owned equivalent.

Call this **remote-root identity** evidence.

**FTP PWD**, directory listing or upload/read-back proves only that the transport can see a location. It is not by itself **public-origin proof**.

If transport target and effective public root cannot be reconciled, stop **before mutation**.

## Preview artifact parity

When a project requires preview/reviewer acceptance, verify the preview serves the exact candidate.

For a static candidate, DEV/HMR is not static-candidate evidence.

Prefer one or more of:

- exact release marker;
- entrypoint asset filenames;
- artifact manifest/hash;
- served asset SHA-256;
- immutable candidate URL/version.

A healthy preview route, container or HTTP 200 does not prove artifact parity.

## Rollback before apply

Rollback evidence must cover what production mutation can actually overwrite.

Valid project-specific mechanisms may include:

- provider snapshot/backup with a known restore procedure;
- downloaded preimage of the exact files to be overwritten;
- versioned release directory/current symlink with proven rollback;
- database backup for schema/data mutation;
- other tested recovery contract.

A local snapshot of the **candidate** is not a backup of current production.

“Provider backup exists” is partial evidence until the restore path is understood. The project decides how much restore proof is required, but a release must not claim rollback safety that was never demonstrated.

## Guarded apply

Before write-capable apply:

- run dry-run/plan mode when available;
- verify candidate identity again;
- verify target identity again;
- verify required config/schema without echoing secrets;
- verify rollback reference;
- verify release scope.

Then apply only through the project-owned adapter.

Do not blind-mirror/delete remote content unless the project contract explicitly allows it.

Preserve **project-specific sequential/atomic policy**. **Do not globalize atomic** promotion, compensating multi-root behavior, or parallel release semantics from another project. Existing owner/project decisions win.

## Publication verification layers

Treat these as different evidence layers:

1. **transport/upload** — client says bytes were sent;
2. **remote target/read-back** — transport can read back expected bytes from its target;
3. **effective origin** — the domain/runtime origin actually serves candidate entrypoints/assets;
4. **CDN/cache** — edge/cached response reflects the intended origin state;
5. **browser/user behavior** — real public UI/API flows work.

Do not collapse these into one “deploy succeeded” statement.

### Critical rules

- upload/read-back success != public release;
- HTTP 200 != candidate acceptance;
- a React/app root existing != candidate acceptance;
- cache purge is not a fix for an origin that still serves old/missing files;
- CDN diagnosis comes **after** origin identity is proven;
- when technically possible, compare public entrypoint references and served asset bytes/hashes with the candidate;
- verify relevant API/media/server routes separately from static frontend assets when the project contains them.

If upload succeeds but public origin still serves the old release:

1. stop further blind uploads;
2. record the mismatch;
3. verify target mapping/publication mechanism;
4. determine whether there is a promotion step, alternate root, build/publish stage, provider cache/origin layer or other missing boundary;
5. repeat a write-capable apply only after a **changed precondition** or new supported hypothesis.

## Browser/runtime acceptance

After origin identity matches the candidate, test the actual production surface required by the project:

- public domain and required subpaths;
- critical user flows;
- mobile/desktop/responsive states when relevant;
- Console/Network;
- media/static assets;
- API/auth/storage behavior where relevant;
- visual quality or accessibility gates owned by the task.

A command-line health check can support this evidence; it does not replace required browser behavior.

## Attempt frontier

Deployment debugging must move forward instead of repeating archaeology.

For every failed attempt record:

- stage/layer;
- hypothesis;
- exact candidate/target/environment;
- action performed;
- result;
- **what was ruled out**;
- **changed precondition** required before the same write-capable action is allowed again;
- next diagnostic layer or experiment.

Do not repeat the **same write-capable action** with unchanged preconditions merely “to try again”.

If the same class of attempt fails again, stop and move to a different diagnostic layer. The next executor starts from the **last proven frontier**, not from the first deploy step.

Read-only probes may be repeated when they answer a new question; identical probes that add no evidence are noise.

## Project-owned deploy contract

Each deployable repository should keep one canonical project-owned deploy/runbook surface. Reuse the existing file when one exists; do not create duplicate deploy docs.

It should identify, without secret values:

- production domain(s)/provider/site;
- build/runtime authority;
- deploy transport and security expectations;
- target root/path plus the target-identity verification method;
- config variable names and credential-free example;
- preview/reviewer artifact identity method;
- rollback mechanism;
- apply command/adapter;
- post-deploy origin/public verification command;
- required browser acceptance;
- provider-specific publication/cache caveats;
- retention policy for release evidence if applicable.

If a durable incident discovers a new provider/project fact, update this canonical surface after the fact is proven.

## Release handoff

A successful production handoff records:

- user/process outcome;
- deployed exact pushed SHA / release id;
- artifact identity/manifest;
- production base/replaced release identity when known;
- target-root identity evidence;
- rollback reference;
- transport result;
- origin/publication result;
- browser/runtime acceptance;
- unresolved risks or owner follow-up.

For a blocked deploy, use the same structure but include the Attempt frontier. A blocked report should make the next agent faster than the previous one.

## Red flags — stop

- “Upload finished, so deploy is done.”
- “FTP read-back matches, so the website must be updated.”
- “The homepage is 200, so release passed.”
- “Purge CDN and see if it helps” before origin is proven current.
- Re-running the same upload with no changed precondition.
- Discovering required browser/runtime tooling only after production mutation.
- Treating DEV preview as the reviewed static candidate.
- Treating a candidate snapshot as production rollback.
- Printing a credential to debug whether it exists.
- Deploying current branch without exact release scope.

Any of these means return to the relevant earlier stage and gather evidence first.
