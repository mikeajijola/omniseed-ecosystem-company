import { compileCompany } from "@omniseed/engine";
import { loadOmniform } from "@omniseed/omniform";

const realisedCapabilityIds = new Set([
  "steward_omniseed_ecosystem",
  "maintain_omniseed_engine",
  "validate_ecosystem_conformance",
  "operate_omniseed_ecosystem",
  "reconcile_omniseed_ecosystem"
]);

export async function capabilityProjectionFixture() {
  const declaration = await loadOmniform(new URL("../omniform.yaml", import.meta.url));
  const resolutions = declaration.spec.capabilities.map(capability => ({
    capabilityId: capability.id,
    coveredRequirements: realisedCapabilityIds.has(capability.id)
      ? capability.requires
      : capability.id === "manage_product_and_roadmap"
        ? capability.requires.slice(0, 2)
        : [],
    missingRequirements: realisedCapabilityIds.has(capability.id)
      ? []
      : capability.id === "manage_product_and_roadmap"
        ? capability.requires.slice(2)
        : capability.requires,
    unresolvedRequirements: [],
    providerGaps: []
  }));
  const registry = compileCompany(declaration, undefined, {
    resolutions,
    providerRegistry: { statusForDesired: (family, providerId) => ({ family, providerId, desired: true, state: "unavailable" }) },
    operationRegistry: { describe: operation => operation }
  });
  const capabilities = registry.capabilities.map(capability => ({
    id: capability.id,
    name: capability.name,
    state: capability.state,
    coveredRequirements: capability.requirements.filter(item => item.covered).length,
    totalRequirements: capability.requirements.length
  }));
  return {
    fixture: "synthetic_os_capability_projection",
    authoritativeObservation: false,
    purpose: "Visual contract fixture for Engine and OmniSeed OS capability views; statuses are deliberately synthetic and are not deployment evidence.",
    companyId: registry.company.id,
    capabilities,
    summary: Object.fromEntries(["realised", "partial", "missing"].map(state => [state, capabilities.filter(item => item.state === state).length]))
  };
}
