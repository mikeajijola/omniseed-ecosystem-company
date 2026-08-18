#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { loadOmniform } from "@omniseed/omniform";
import { assembleRuntime, HttpStateStore, MemoryStateStore } from "@omniseed/engine";

export async function runReconciliation({
  operation = "plan",
  declarationPath = resolve("omniform.yaml"),
  desiredRevision = process.env.OMNISEED_DESIRED_REVISION ?? gitRevision(),
  environment = process.env.OMNISEED_ENVIRONMENT ?? "production",
  store,
  protocolProviders,
  dryRun = false
} = {}) {
  if (!/^[0-9a-f]{40}$/i.test(desiredRevision)) throw new Error("Reconciliation requires the exact approved 40-character Git revision.");
  if (!["plan", "observe"].includes(operation)) throw new Error("Reconciliation operation must be plan or observe.");
  const declaration = await loadOmniform(declarationPath);
  const configuredStore = store ?? (dryRun
    ? new MemoryStateStore()
    : new HttpStateStore({ endpoint: required("OMNISEED_STATE_ENDPOINT"), token: required("OMNISEED_STATE_TOKEN") }));
  const configuredProviders = protocolProviders ?? await providerConfiguration();
  const runtime = await assembleRuntime({ declaration, store: configuredStore, protocolProviders: configuredProviders, binding: { desiredRevision, environment } });
  try {
    const identity = (declaration.spec.resources?.identity ?? []).find(item => item.id === "reconciler_identity");
    if (!identity) throw new Error("The company has no declared reconciler identity.");
    const authorization = { actorId: identity.id, permissions: [...(identity.spec?.authority ?? [])] };
    await runtime.engine.invokeOperation(declaration, "bind_company", { desiredRevision, environment }, authorization);
    const operationId = operation === "plan" ? "generate_plan" : "observe_company";
    const result = await runtime.engine.invokeOperation(declaration, operationId, {}, authorization);
    return { companyId: declaration.metadata.id, desiredRevision, operationId, providerBindings: runtime.desiredProviderBindings, result };
  } finally {
    await runtime.close();
  }
}

async function providerConfiguration() {
  const inline = process.env.OMNISEED_PROVIDER_CONFIGURATION;
  const path = process.env.OMNISEED_PROVIDER_CONFIGURATION_FILE;
  if (inline && path) throw new Error("Configure Providers with either inline JSON or a file, not both.");
  if (!inline && !path) return [];
  const parsed = JSON.parse(inline ?? await readFile(resolve(path), "utf8"));
  if (!Array.isArray(parsed)) throw new Error("Provider configuration must be a JSON array.");
  return parsed;
}

function required(name) { const value = process.env[name]; if (!value) throw new Error(`Missing ${name}.`); return value; }
function gitRevision() { return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(); }

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const operation = process.argv[2] ?? "plan", dryRun = process.argv.includes("--dry-run");
  runReconciliation({ operation, dryRun }).then(result => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)).catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
