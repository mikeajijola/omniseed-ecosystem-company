# Operating the OmniSeed Ecosystem company

This repository is the approved desired-state authority for one company: the OmniSeed Ecosystem.

- Keep `omniform.yaml` free of live observations, credentials, deployment results, and transient evidence.
- Capabilities remain implementation-independent and are realised only through canonical primitive resources.
- Provider selection is per primitive family. A requested Provider is not evidence that it is installed or healthy.
- Provider IDs identify supplying organisations. Products such as Eve, Vercel Functions, GitHub Actions, and GitHub Checks belong in implementation configuration beneath Vercel or GitHub, never as separate Providers.
- Lily is a replaceable Agent participant in Company Stewardship. OmniSeed OS is an optional human-interface realisation.
- All desired-state changes use a branch and pull request. Do not write a second canonical company definition into runtime state.
- Durable evidence may be referenced from Git; live observed state remains in OmniSeed.

Validate `omniform.yaml` with the compatible published Omniform package before proposing a change.
