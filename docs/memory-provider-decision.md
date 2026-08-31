# Memory Provider decision

The `memory` family default is Neon because the reconciliation capability's durable runtime-state resource is the company-wide continuity requirement and Neon implements the canonical durable-state protocol. This desired selection is not evidence that Neon is installed, connected, or healthy.

Omnicede remains an explicit resource-level selection for `ecosystem_memory`. That resource supplies organisational context and engineering history through embedded graph memory; it does not supply Engine reconciliation state. Omniform's resource-level `provider` field preserves these distinct semantics without inventing a second primitive family.

| Resource | Requirements supplied | Provider | Expected observation |
| --- | --- | --- | --- |
| `ecosystem_memory` | `organisational_context`, `engineering_history` | Omnicede | `omnicede_memory_state` with `omnicede_memory_observation` evidence |
| `engine_runtime_state` | `runtime_state_continuity` | Neon | `neon_memory_state` with `neon_memory_observation` evidence |

Runtime observation remains authoritative. A repository or manifest claim alone cannot mark either resource realised.
