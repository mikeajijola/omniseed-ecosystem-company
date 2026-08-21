# OmniSeed Ecosystem Company

Provider bindings in this company identify supplying organisations. Products, services, frameworks, SDKs, and features used beneath those bindings are implementation details. In particular, Lily is the declared Agent actor, Eve is its current Vercel framework, and Vercel is the Provider. GitHub Actions and Checks remain products beneath GitHub. The authoritative rule lives in [ecosystem Provider semantics](https://github.com/mikeajijola/omniseed-ecosystem/blob/main/docs/provider-semantics.md).

This is the canonical Git-backed desired company definition for the OmniSeed Ecosystem. It is deliberately separate from the public repositories that implement Omniform, OmniSeed, OmniSeed OS, Providers, and ecosystem conformance.

The durable company identity is `omniseed_ecosystem`. Git `main` is approved desired state. OmniSeed runtime state, observations, evidence, deployments, and health do not belong in this repository.

The production slice models five real operating capabilities: stewardship, engine maintenance, ecosystem conformance, the human operating surface, and reconciliation of the ecosystem company itself. Reconciliation is not a privileged bootstrap path. Its named realisation composes a GitHub-supplied workflow, the ordinary OmniSeed operation boundary, governed policy, durable runtime state, observation, and a service identity. It uses the same exact-plan approval, Provider apply, observation, and evidence path as any other capability.

The family Provider map is a default. Individual primitive resources bind their supplying organisation explicitly where the company composes more than one Provider in a family: Omnicede supplies organisational memory while Neon is selected for durable runtime state, GitHub and Vercel supply different workflow/connector resources, and OmniSeed supplies Engine-native skills, policies, and observations. These declarations remain desired state only. OmniSeed must still install, connect, apply, and observe each Provider before the relevant requirement or capability becomes realised.

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

The preview input is valid only for `plan`. It makes the first reviewed plan use
the same empty in-memory runtime state that `bootstrap` recomputes, avoiding a
circular dependency on the OS-hosted durable endpoint before the OS exists. It
does not apply resources or create a second desired-state authority. Once the
state service has been seeded, ordinary plans fail closed against that durable
state and the preview input must not be used.

For the smallest production slice the reviewed resource list is `lily,omniseed_os`.
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

The `production` environment is the human approval boundary for a bootstrap
dispatch. The workflow actor is recorded as a principal of the declared
`operator_identities` resource; the GitHub Actions reconciler has `plan.apply`
but deliberately lacks `plan.approve`, so it cannot approve its own plan.

Omnicede is included only when `OMNICEDE_DATABASE_PATH` names genuinely durable mounted storage. The workflow does not label an ephemeral Actions SQLite file as installed production memory.

Provider credentials remain in the runtime environment used by their processes; they are not stored in Omniform or printed by the runner. Automatic reconciliation on merge is intentionally not claimed yet. It should be enabled only after the production state service and required Provider implementations have been observed working.
