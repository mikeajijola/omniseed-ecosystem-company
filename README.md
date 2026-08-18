# OmniSeed Ecosystem Company

Provider bindings in this company identify supplying organisations. Products, services, frameworks, SDKs, and features used beneath those bindings are implementation details. In particular, Lily is the declared Agent actor, Eve is its current Vercel framework, and Vercel is the Provider. GitHub Actions and Checks remain products beneath GitHub. The authoritative rule lives in [ecosystem Provider semantics](https://github.com/mikeajijola/omniseed-ecosystem/blob/main/docs/provider-semantics.md).

This is the canonical Git-backed desired company definition for the OmniSeed Ecosystem. It is deliberately separate from the public repositories that implement Omniform, OmniSeed, OmniSeed OS, Providers, and ecosystem conformance.

The durable company identity is `omniseed_ecosystem`. Git `main` is approved desired state. OmniSeed runtime state, observations, evidence, deployments, and health do not belong in this repository.

The initial vertical slice models four real operating capabilities: stewardship, engine maintenance, ecosystem conformance, and the human operating surface. It names Lily and OmniSeed OS as replaceable realisation participants, selects GitHub for the `workflows` family, and selects Omnicede for the `memory` family. Omnicede's embedded graph and SQLite storage are implementation details beneath that Provider selection. Selection remains desired state only: OmniSeed must still install, connect, apply, and observe the Provider before either memory-backed requirement becomes realised. Other Provider gaps remain explicit until implementations exist.
