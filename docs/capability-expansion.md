# OmniSeed business capability expansion

This design note records the rationale and review evidence for issue #98. The canonical declaration remains `omniform.yaml`; this document and its fixture are review aids, not a second desired-state definition or live observation.

## Inventory before and after

Before this change, the company declared five capabilities, all in the self-hosting/control-plane slice:

| Domain | Before | After |
| --- | --- | --- |
| Company stewardship | Steward OmniSeed Ecosystem | Steward OmniSeed Ecosystem; Set Company Strategy and Governance |
| Product | — | Manage Product and Roadmap |
| Engineering and release | Maintain OmniSeed Engine | Maintain OmniSeed Engine; Engineer and Release OmniSeed Products |
| Provider ecosystem | — | Grow and Manage Provider Ecosystem |
| Architecture and conformance | Validate Ecosystem Conformance | Validate Ecosystem Conformance; Govern OmniSeed Architecture |
| Operating interface and reconciliation | Operate OmniSeed Ecosystem; Reconcile OmniSeed Ecosystem | Operate OmniSeed Ecosystem; Reconcile OmniSeed Ecosystem |
| Research and innovation | — | Conduct Research and Experiments |
| Security, risk, privacy, compliance | — | Manage Security, Risk, Privacy, and Compliance |
| Documentation and education | — | Produce Documentation and Education |
| Publishing and communications | — | Publish Content and Communications |
| Community and open source | — | Grow Open Source Community |
| Partnerships | — | Develop Partnerships and Ecosystem |
| Accelerator programmes | — | Operate Accelerator Programmes |
| Customer operations | — | Onboard, Support, and Retain Customers |
| Marketing | — | Generate Market Demand |
| Sales and revenue | — | Manage Sales, Revenue, and Commercial Operations |
| Finance and procurement | — | Manage Finance, Accounting, and Procurement |
| Legal and corporate administration | — | Manage Legal, Corporate, IP, and Licensing |
| People and contributors | — | Develop People and Contributors |
| Analytics and knowledge | — | Measure Business and Manage Knowledge |
| Incident and continuity | — | Respond to Incidents and Ensure Continuity |

The result is 25 desired capabilities across 21 coherent domains. Each adopted capability states an outcome and requirement IDs at canonical primitive-family boundaries. Actor type, product, Provider, interface, and implementation choices are absent from those definitions.

## Realisation truthfulness

Only the five pre-existing capabilities retain named realisations. The 20 newly adopted business capabilities have no named realisation because the repository has no approved resource composition and no Provider/runtime evidence for them. Their omission is intentional: the Engine projects them as `missing` until real resources cover requirements, and can project `partial` when only some requirements are covered.

[`fixtures/capability-projection.json`](fixtures/capability-projection.json) is a deterministic visual-contract fixture generated through the published Engine compiler. It demonstrates five realised, one partial, and nineteen missing capabilities so Engine inspection and OmniSeed OS can be checked against the same IDs and status vocabulary. It is prominently marked synthetic and is not evidence that any deployment has those states. Live status and evidence remain in OmniSeed runtime state.

For Lily's question, “What does this company need to be able to do?”, the expected answer is the same 25-capability inventory above, independent of who or what may eventually perform each capability.

## Catalogue reconciliation and exclusions

The reusable catalogue tracked by `mikeajijola/omniseed-ecosystem#28` was reviewed as input. At the time of adoption it defines domain and semantic conventions in its open issue but has not published a versioned machine-readable catalogue. The company therefore adopts stable OmniSeed-specific IDs directly and has no runtime dependency on that work. Names can be reconciled later through another governed change if the published catalogue establishes materially different conventions.

The catalogue candidates intentionally not adopted are generic platform/IT operations and generic procurement/vendor management as separate capabilities. OmniSeed's present desired model specialises platform operations into Engine maintenance, ecosystem operation, reconciliation, Provider lifecycle, security, and continuity; procurement is included with finance. Manufacturing, physical logistics, facilities, and embodied-machine operations are excluded because they are not presently part of OmniSeed's intended operating model. Exclusion means “not desired now”, while the 20 declared-but-unrealised capabilities mean “desired, with the gap visible”.
