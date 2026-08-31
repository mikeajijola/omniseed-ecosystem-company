# Identity Provider decision

Identity resources declare principals recognised by the company; they do not grant agency or authority by themselves. The family default remains GitHub because contributors, operators, and the reconciliation service are recognised through GitHub. Their products and identity kinds are implementation configuration beneath that Provider.

Lily is the exception. OmniSeed recognises the stable `lily` Agent subject at the company operation boundary, so `lily_identity` selects OmniSeed explicitly rather than implying that a GitHub user or service identity is Lily. This desired binding is not evidence that any Provider is installed, connected, or healthy.

| Resource | Identity kind | Provider | Authority boundary |
| --- | --- | --- | --- |
| `lily_identity` | Agent | OmniSeed | Identity only; Lily's allowed and denied actions remain in `lily_authority` |
| `contributor_identities` | Human | GitHub | Identity only |
| `operator_identities` | Human | GitHub | Independent approval and governed company-change authority |
| `reconciler_identity` | Service | GitHub | Apply and reconciliation authority, with self-approval forbidden |

No identity resource covers the unmet identity requirements of the expanded business capabilities. Those capabilities remain unrealised until a later governed change selects real resources and Providers.
