# OmniSeed Ecosystem Company

Provider bindings in this company identify supplying organisations. Products, services, frameworks, SDKs, and features used beneath those bindings are implementation details. In particular, Lily is the declared Agent actor, Eve is its current Vercel framework, and Vercel is the Provider. GitHub Actions and Checks remain products beneath GitHub. The authoritative rule lives in [ecosystem Provider semantics](https://github.com/mikeajijola/omniseed-ecosystem/blob/main/docs/provider-semantics.md).

This is the canonical Git-backed desired company definition for the OmniSeed Ecosystem. It is deliberately separate from the public repositories that implement Omniform, OmniSeed, OmniSeed OS, Providers, and ecosystem conformance.

The durable company identity is `omniseed_ecosystem`. Git `main` is approved desired state. OmniSeed runtime state, observations, evidence, deployments, and health do not belong in this repository.

The desired company models 25 capabilities across the wider OmniSeed business, including strategy, product, engineering, Providers, architecture, research, risk, education, publishing, community, partnerships, programmes, customers, go-to-market, corporate operations, people, measurement, and continuity. This breadth does not claim those capabilities are deployed: only the five established self-hosting capabilities have named realisations, while the other 20 intentionally remain unrealised until approved resources and runtime evidence exist. The [capability expansion design note](docs/capability-expansion.md) provides the grouped before/after inventory, exclusions, and a mixed-state OS projection fixture.

Reconciliation is not a privileged bootstrap path. Its named realisation composes a GitHub-supplied workflow, the ordinary OmniSeed operation boundary, governed policy, durable runtime state, observation, and a service identity. It uses the same exact-plan approval, Provider apply, observation, and evidence path as any other capability.

The family Provider map is a default. Individual primitive resources bind their supplying organisation explicitly where the company composes more than one Provider in a family: Omnicede supplies organisational memory while Neon is selected for durable runtime state, GitHub and Vercel supply different workflow/connector resources, and OmniSeed supplies Engine-native skills, policies, and observations. These declarations remain desired state only. OmniSeed must still install, connect, apply, and observe each Provider before the relevant requirement or capability becomes realised.

The rationale and complete requirement mapping for the split memory selection is recorded in [`docs/memory-provider-decision.md`](docs/memory-provider-decision.md). Neon is the family default; `ecosystem_memory` deliberately overrides it with Omnicede.

Identity bindings follow the same rule: GitHub supplies the human and service identities used by repository governance, while OmniSeed recognises Lily's Agent subject at the company operation boundary. The kinds and unchanged authority separation are recorded in [`docs/identity-provider-decision.md`](docs/identity-provider-decision.md).

## Repeatable reconciliation

[`scripts/reconcile.mjs`](scripts/reconcile.mjs) assembles the Engine from this approved declaration, a durable state endpoint, and an explicit installed-Provider configuration. The same declaration, exact Git revision, durable state, and equivalent Provider configuration return the same still-valid plan.

The initial production bootstrap is also declarative and governed. First run
`plan` with the explicit `bootstrap_preview` input enabled, review its exact ID,
hash, and resource actions, then dispatch
`bootstrap` with that ID, hash, and an explicit comma-separated list of approved
resource IDs. The runner recomputes the plan, fails if either binding changed,
resolves `plan.approve` from the declared operator identity, and invokes the
ordinary `apply_plan` operation as the separately declared reconciler identity.
It applies only the selected resource actions, seeds the newly available durable
state service, and invokes ordinary observation so desired and observed
revisions remain separate. Bootstrap refuses a non-empty durable company state;
all later runs use that durable state directly.

After bootstrap, every push to canonical `main` automatically runs `plan`
against the exact merged revision and persists the resulting plan. Review its
exact ID, hash, and resource actions. A separate protected
`apply` dispatch must supply that exact ID and hash plus the explicitly approved
resource IDs. The runner loads the reviewed plan from durable Engine state,
records approval under the declared operator identity, invokes the ordinary
`apply_plan` operation under the separately declared reconciler identity, and
then observes the company. A missing, changed, already-consumed, or mismatched
plan fails before Provider mutation.

The preview input is valid only for `plan`. It makes the first reviewed plan use
the same empty in-memory runtime state that `bootstrap` recomputes, avoiding a
circular dependency on the OS-hosted durable endpoint before the OS exists. It
does not apply resources or create a second desired-state authority. Once the
state service has been seeded, ordinary plans fail closed against that durable
state and the preview input must not be used.

For the smallest production slice the reviewed resource list is `lily,omniseed_os`.
They remain distinct Agent and interface resources but intentionally share the
single `omniseed-ecosystem-os` Vercel project and immutable runtime artifact.
The Lily resource retains its own implementation revision beneath that shared
hosting source.
Nothing in the script contains Vercel project IDs, source repositories, package
versions, endpoints, or Agent facts: those all come from `omniform.yaml`.
Deploying another company with the same declarations and equivalent normal
per-environment credential/configuration references therefore produces the same
plan and immutable resource intents. Provider-assigned deployment IDs, URLs,
timestamps, and other ordinary external outputs are observed rather than
predicted.

Pull requests run validation and clean-state equivalence tests. A protected manual run of [the reconciliation workflow](.github/workflows/reconcile.yml) uses the `production` GitHub environment and requires:

- `OMNISEED_STATE_ENDPOINT` as an environment variable;
- `OMNISEED_STATE_TOKEN` as a secret;
- `VERCEL_TEAM_ID` and `VERCEL_STATUS_PROJECT_ID` as ordinary Provider connection settings;
- checked-out, commit-pinned GitHub, Vercel, Neon, and OmniSeed Provider processes assembled by `scripts/provider-configuration.mjs`;
- server-side Provider credentials in the protected production environment.

Production Provider processes receive a bounded 15-second startup allowance and
a six-minute request allowance. The latter covers the declared Vercel
deployment-readiness wait while remaining bounded; the local Engine protocol's
two-second test default is intentionally not used as a production deployment
contract.

The unprotected `production-planning` environment supplies only the durable
state endpoint and state token needed to bind an exact merged revision and
persist a plan. The automatic path is forced to `plan`, receives no Provider
mutation credentials, and cannot approve or apply. The `production` environment
is the human approval boundary for bootstrap and ordinary apply dispatches. The
workflow actor is recorded as a principal of the declared
`operator_identities` resource; the GitHub Actions reconciler has `plan.apply`
but deliberately lacks `plan.approve`, so it cannot approve its own plan.

Omnicede is included only when `OMNICEDE_DATABASE_PATH` names genuinely durable mounted storage. The workflow does not label an ephemeral Actions SQLite file as installed production memory.

Provider credentials remain in the runtime environment used by their processes; they are not stored in Omniform or printed by the runner. Enabling the automatic path requires configuring `OMNISEED_STATE_ENDPOINT` and `OMNISEED_STATE_TOKEN` in `production-planning` without a deployment approval rule. This repository proves the forced plan-only trigger and authority separation; a successful production run and persisted plan remain live evidence.

The production Lily and OmniSeed OS resources declare one shared `omniseed-ecosystem-os` Vercel project and the same immutable OmniSeed OS source revision. Lily remains a distinct organisational Agent implemented with Eve; sharing a deployment does not collapse Lily into the interface. The Company Change workflow separately pins the GitHub Provider implementation, repository scope, server-side credential reference, and governed merge policy. Re-running reconciliation from the same Omniform therefore produces the same topology apart from secret values and Provider-assigned resource identities.

The non-production [portable Agent Company Change fixture](docs/fixtures/portable-agent-company-change.json)
selects a second product/framework through the same declared interaction protocol
while leaving the supplying Vercel Provider and Agent resource ID unchanged. It
is sandbox-only and marked for reversion; it is deterministic contract evidence,
not proof that a second runtime has been deployed or accepted.
