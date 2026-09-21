# Governed release capability evidence

`engineer_and_release_omniseed_products` now has the `omniform_alpha_release` realisation. Its desired outcome is implementation-neutral: an exact reviewed source becomes an attributable, consumer-verifiable artifact through an approved channel. GitHub Actions and npm are implementation details recorded beneath the workflow and observation resources.

The bounded experiment evaluates the immutable `@omniseed/omniform@1.0.0-alpha.7` publication. Machine evidence is in `docs/fixtures/omniform-alpha7-release-evidence.json`; run `node scripts/release-evidence.mjs docs/fixtures/omniform-alpha7-release-evidence.json`. The expected result is `PASS` only because source review/checks, exact owner intent, workflow head/run, registry version/channel/integrity, SLSA provenance, and clean registry consumer evidence agree.

Missing registry, provenance, workflow, or consumer evidence is `INDETERMINATE`. Any contradictory source, workflow, version, channel, integrity, provenance, approval, or consumer result is `FAIL`. Workflow success or registry existence alone is never `PASS`. Reconciliation re-observes before a safe idempotent retry; contradictions stop and require investigation or a new governed plan. This experiment grants no stable-channel promotion, arbitrary workflow, credential-administration, or unrelated repository authority.
