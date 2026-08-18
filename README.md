# OmniSeed Ecosystem Company

Provider bindings in this company identify supplying organisations. Products, services, frameworks, SDKs, and features used beneath those bindings are implementation details. In particular, Lily is the declared Agent actor, Eve is its current Vercel framework, and Vercel is the Provider. GitHub Actions and Checks remain products beneath GitHub. The authoritative rule lives in [ecosystem Provider semantics](https://github.com/mikeajijola/omniseed-ecosystem/blob/main/docs/provider-semantics.md).

This is the canonical Git-backed desired company definition for the OmniSeed Ecosystem. It is deliberately separate from the public repositories that implement Omniform, OmniSeed, OmniSeed OS, Providers, and ecosystem conformance.

The durable company identity is `omniseed_ecosystem`. Git `main` is approved desired state. OmniSeed runtime state, observations, evidence, deployments, and health do not belong in this repository.

The production slice models five real operating capabilities: stewardship, engine maintenance, ecosystem conformance, the human operating surface, and reconciliation of the ecosystem company itself. Reconciliation is not a privileged bootstrap path. Its named realisation composes a GitHub-supplied workflow, the ordinary OmniSeed operation boundary, governed policy, durable runtime state, observation, and a service identity. It uses the same exact-plan approval, Provider apply, observation, and evidence path as any other capability.

The family Provider map is a default. Individual primitive resources bind their supplying organisation explicitly where the company composes more than one Provider in a family: Omnicede supplies organisational memory while Neon is selected for durable runtime state, and GitHub and Vercel supply different workflow/connector resources. These declarations remain desired state only. OmniSeed must still install, connect, apply, and observe each Provider before the relevant requirement or capability becomes realised.

## Repeatable reconciliation

[`scripts/reconcile.mjs`](scripts/reconcile.mjs) assembles the Engine from this approved declaration, a durable state endpoint, and an explicit installed-Provider configuration. It invokes only the declared `bind_company`, `generate_plan`, and `observe_company` operations. It has no apply or approval shortcut. The same declaration, exact Git revision, durable state, and equivalent Provider configuration return the same still-valid plan.

Pull requests run validation and clean-state equivalence tests. A protected manual run of [the reconciliation workflow](.github/workflows/reconcile.yml) uses the `production` GitHub environment and requires:

- `OMNISEED_STATE_ENDPOINT` as an environment variable;
- `OMNISEED_STATE_TOKEN` as a secret;
- optional `OMNISEED_PROVIDER_CONFIGURATION` JSON as a secret containing Provider process commands and non-secret configuration references.

Provider credentials remain in the runtime environment used by their processes; they are not stored in Omniform or printed by the runner. Automatic reconciliation on merge is intentionally not claimed yet. It should be enabled only after the production state service and required Provider implementations have been observed working.
