#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { execFileSync } from "node:child_process";
import { loadOmniform } from "@omniseed/omniform";
import { assembleRuntime, HttpStateStore, MemoryStateStore, OmniSeed } from "@omniseed/engine";

export async function runReconciliation({
  operation = "plan",
  declarationPath = resolve("omniform.yaml"),
  desiredRevision = process.env.OMNISEED_DESIRED_REVISION ?? gitRevision(),
  environment = process.env.OMNISEED_ENVIRONMENT ?? "production",
  store,
  durableStore,
  providerHandles,
  protocolProviders,
  dryRun = false,
  bootstrapPreview = process.env.OMNISEED_BOOTSTRAP_PREVIEW === "true",
  expectedPlanId = process.env.OMNISEED_APPROVED_PLAN_ID,
  expectedPlanHash = process.env.OMNISEED_APPROVED_PLAN_HASH,
  approvedResourceIds = csv(process.env.OMNISEED_APPROVED_RESOURCES),
  approverIdentity = process.env.OMNISEED_APPROVER_IDENTITY ?? "operator_identities",
  approverPrincipal = process.env.OMNISEED_APPROVER_PRINCIPAL ?? "operator"
} = {}) {
  if (!/^[0-9a-f]{40}$/i.test(desiredRevision)) throw new Error("Reconciliation requires the exact approved 40-character Git revision.");
  if (!["plan", "bootstrap", "observe"].includes(operation)) throw new Error("Reconciliation operation must be plan, bootstrap, or observe.");
  if (bootstrapPreview && operation !== "plan") throw new Error("An initial bootstrap preview is valid only for the plan operation.");
  const declaration = await loadOmniform(declarationPath);
  const configuredStore = store ?? (dryRun || operation === "bootstrap" || bootstrapPreview
    ? new MemoryStateStore()
    : new HttpStateStore({ endpoint: required("OMNISEED_STATE_ENDPOINT"), token: required("OMNISEED_STATE_TOKEN") }));
  const configuredProviders = protocolProviders ?? await providerConfiguration();
  const runtimeArguments = { declaration, protocolProviders: configuredProviders, providerHandles: providerHandles ?? [], binding: { desiredRevision, environment } };
  const runtime = await assembleRuntime({ ...runtimeArguments, store: configuredStore });
  try {
    const identity = (declaration.spec.resources?.identity ?? []).find(item => item.id === "reconciler_identity");
    if (!identity) throw new Error("The company has no declared reconciler identity.");
    const authorization = { actorId: identity.id, permissions: [...(identity.spec?.authority ?? [])] };
    await runtime.engine.invokeOperation(declaration, "bind_company", { desiredRevision, environment }, authorization);
    if (operation === "bootstrap") {
      if (!expectedPlanId || !expectedPlanHash || approvedResourceIds.length === 0) throw new Error("Bootstrap requires an exact approved plan ID, plan hash, and non-empty approved resource list.");
      const targetStore = durableStore ?? new HttpStateStore({ endpoint: required("OMNISEED_STATE_ENDPOINT"), token: required("OMNISEED_STATE_TOKEN") });
      const existing = await targetStore.load(declaration.metadata.id);
      if (existing.version !== 0 || existing.history.length || existing.deployed.length || existing.plans.length) throw new Error("Bootstrap is allowed only when the durable company runtime state is empty.");
      const plan = await runtime.engine.invokeOperation(declaration, "generate_plan", {}, authorization);
      if (plan.id !== expectedPlanId || plan.hash !== expectedPlanHash) throw new Error("Bootstrap plan does not match the exact reviewed plan ID and hash.");
      const requested = new Set(approvedResourceIds);
      const selected = plan.actions.filter(action => requested.has(action.resourceId));
      const selectedResources = new Set(selected.map(action => action.resourceId));
      const unknown = [...requested].filter(id => !selectedResources.has(id));
      if (unknown.length) throw new Error(`Approved resources are absent from the reviewed plan: ${unknown.join(", ")}`);
      const approver = declaredIdentityAuthorization(declaration, approverIdentity, `${approverIdentity}:${approverPrincipal}`);
      const approval = await runtime.engine.approve(plan, selected.map(action => action.id), approver);
      const applied = await runtime.engine.invokeOperation(declaration, "apply_plan", { plan, approval }, authorization);
      await targetStore.save(applied.state, 0);
      const durableEngine = new OmniSeed({ store: targetStore, providers: runtime.providers, binding: { desiredRevision, environment } });
      const observedRegistry = await durableEngine.invokeOperation(declaration, "observe_company", {}, authorization);
      const reconciled = await targetStore.load(declaration.metadata.id);
      return {
        companyId: declaration.metadata.id,
        desiredRevision,
        operationId: "apply_plan",
        providerBindings: runtime.desiredProviderBindings,
        reviewedPlan: { id: plan.id, hash: plan.hash, approvedResourceIds: [...requested], approvedActionIds: approval.approvedActionIds },
        approval: { actorId: approval.actorId, approvedAt: approval.approvedAt },
        result: { plan: applied.plan, results: applied.results },
        durableState: { version: reconciled.version, desiredRevision: reconciled.binding.desiredRevision, observedRevision: reconciled.binding.observedRevision, historyEntries: reconciled.history.length, deployedResources: reconciled.deployed.map(resource => ({ family: resource.family, id: resource.id, provider: resource.provider })) },
        observation: { companyId: observedRegistry.company.id, observedStateRevision: observedRegistry.instance.observedStateRevision, evidenceCount: observedRegistry.evidence.length }
      };
    }
    const operationId = operation === "plan" ? "generate_plan" : "observe_company";
    const result = await runtime.engine.invokeOperation(declaration, operationId, {}, authorization);
    return { companyId: declaration.metadata.id, desiredRevision, operationId, providerBindings: runtime.desiredProviderBindings, result };
  } finally {
    await runtime.close();
  }
}

function declaredIdentityAuthorization(declaration, identityId, actorId) {
  const identity = (declaration.spec.resources?.identity ?? []).find(item => item.id === identityId);
  if (!identity) throw new Error(`The company has no declared approval identity: ${identityId}.`);
  const permissions = [...(identity.spec?.authority ?? [])];
  if (!permissions.includes("plan.approve")) throw new Error(`Declared approval identity ${identityId} lacks plan.approve.`);
  return { actorId, permissions };
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
function csv(value) { return String(value ?? "").split(",").map(item => item.trim()).filter(Boolean); }
function gitRevision() { return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim(); }

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const operation = process.argv[2] ?? "plan", dryRun = process.argv.includes("--dry-run");
  runReconciliation({ operation, dryRun }).then(result => process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)).catch(error => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
