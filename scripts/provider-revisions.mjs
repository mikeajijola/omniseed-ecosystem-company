#!/usr/bin/env node
import { loadOmniform } from "@omniseed/omniform";
import { pathToFileURL } from "node:url";

export function declaredProviderRevision(declaration, providerId) {
  const revisions = new Set();
  for (const resources of Object.values(declaration.spec.resources ?? {})) {
    for (const resource of resources ?? []) {
      if (resource.provider !== providerId) continue;
      const revision = resource.spec?.providerRevision;
      if (revision !== undefined) revisions.add(revision);
    }
  }
  if (revisions.size !== 1) throw new Error(`Provider ${providerId} must declare exactly one providerRevision; found ${revisions.size}.`);
  const [revision] = revisions;
  if (!/^[0-9a-f]{40}$/.test(revision)) throw new Error(`Provider ${providerId} revision must be an exact 40-character Git SHA.`);
  return revision;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const declaration = await loadOmniform(process.argv[2] ?? "omniform.yaml");
  process.stdout.write(`github=${declaredProviderRevision(declaration, "github")}\n`);
  process.stdout.write(`google=${declaredProviderRevision(declaration, "google")}\n`);
}
