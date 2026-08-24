import test from "node:test";
import assert from "node:assert/strict";
import { MemoryStateStore, ReferenceProvider } from "@omniseed/engine";
import { loadOmniform } from "@omniseed/omniform";
import { formatReconciliationError, runReconciliation } from "../scripts/reconcile.mjs";

const revision = "a".repeat(40);

test("the same approved company and normal configuration yield an identical reconciliation plan", async () => {
  const declaration = await loadOmniform(new URL("../omniform.yaml", import.meta.url));
  const os = declaration.spec.resources.connectors.find(item => item.id === "omniseed_os");
  assert.equal(os.spec.companyBinding.desiredRevision, undefined, "the declaration must not self-pin its own runtime revision");
  const first = await runReconciliation({ desiredRevision: revision, environment: "test", store: new MemoryStateStore(), protocolProviders: [] });
  const second = await runReconciliation({ desiredRevision: revision, environment: "test", store: new MemoryStateStore(), protocolProviders: [] });
  assert.equal(first.companyId, "omniseed_ecosystem");
  assert.equal(first.result.id, second.result.id);
  assert.equal(first.result.hash, second.result.hash);
  assert.deepEqual(first.result.actions, second.result.actions);
  assert.ok(first.providerBindings.some(item => item.resourceId === "engine_runtime_state" && item.providerId === "neon"));
  assert.ok(first.providerBindings.some(item => item.resourceId === "ecosystem_memory" && item.providerId === "omnicede"));
});

test("Lily and OmniSeed OS share one immutable Vercel runtime without collapsing their identities", async () => {
  const declaration = await loadOmniform(new URL("../omniform.yaml", import.meta.url));
  const lily = declaration.spec.resources.agents.find(item => item.id === "lily");
  const os = declaration.spec.resources.connectors.find(item => item.id === "omniseed_os");

  assert.equal(lily.spec.runtime.project, "omniseed-ecosystem-os");
  assert.equal(os.spec.project, lily.spec.runtime.project);
  assert.deepEqual(lily.spec.runtime.source, os.spec.source);
  assert.match(lily.spec.runtime.source.revision, /^[0-9a-f]{40}$/);
  assert.equal(lily.spec.implementation.repository, "https://github.com/mikeajijola/omniseed-lily.git");
  assert.notEqual(lily.spec.implementation.repository, lily.spec.runtime.source.repository);
  assert.equal(lily.spec.implementation.framework, "eve");
  assert.equal(lily.spec.implementation.model, "nvidia/nemotron-3.5-lightning-free");
  assert.equal(lily.provider, "vercel");
  assert.equal(os.spec.provider, "vercel");
  assert.equal(lily.spec.runtime.providerRevision, os.spec.providerRevision);
  assert.equal(os.spec.access.stewardChat, "public");
  const interfacePolicy = declaration.spec.resources.policies.find(item => item.id === "interface_policy");
  assert.equal(interfacePolicy.spec.stewardChat, "public");
  assert.equal(interfacePolicy.spec.mutationsRequireGovernedOperations, true);
});

test("repeat planning against one durable state returns the exact same plan and Activity", async () => {
  const store = new MemoryStateStore();
  const first = await runReconciliation({ desiredRevision: revision, environment: "test", store, protocolProviders: [] });
  const second = await runReconciliation({ desiredRevision: revision, environment: "test", store, protocolProviders: [] });
  const state = await store.load("omniseed_ecosystem");
  assert.deepEqual(second.result, first.result);
  assert.deepEqual(state.history.map(item => item.type), ["company_binding_recorded", "plan_generated"]);
});

test("observation keeps desired and observed revisions separate", async () => {
  const store = new MemoryStateStore();
  await runReconciliation({ operation: "observe", desiredRevision: revision, environment: "test", store, protocolProviders: [] });
  const state = await store.load("omniseed_ecosystem");
  assert.equal(state.binding.desiredRevision, revision);
  assert.equal(state.binding.observedRevision, revision);
  assert.equal(state.history.at(-1).type, "reconciled");
});

test("bootstrap applies only exact reviewed declared resources and seeds durable Engine state", async () => {
  const providers = [new ReferenceProvider({ id: "vercel", families: ["agents", "connectors"] })];
  const preview = await runReconciliation({ desiredRevision: revision, environment: "test", store: new MemoryStateStore(), providerHandles: providers });
  const durableStore = new MemoryStateStore();
  const bootstrapped = await runReconciliation({
    operation: "bootstrap",
    desiredRevision: revision,
    environment: "test",
    store: new MemoryStateStore(),
    durableStore,
    providerHandles: providers,
    expectedPlanId: preview.result.id,
    expectedPlanHash: preview.result.hash,
    approvedResourceIds: ["lily", "omniseed_os"],
    approverPrincipal: "reviewer"
  });
  const state = await durableStore.load("omniseed_ecosystem");
  assert.deepEqual(state.deployed.map(item => item.id), ["lily", "omniseed_os"]);
  assert.deepEqual(bootstrapped.reviewedPlan.approvedResourceIds, ["lily", "omniseed_os"]);
  assert.equal(bootstrapped.approval.actorId, "operator_identities:reviewer");
  assert.deepEqual(state.history.map(item => item.type), ["company_binding_recorded", "plan_generated", "plan_approved", "plan_applied", "reconciled"]);
  assert.equal(state.binding.desiredRevision, revision);
  assert.equal(state.binding.observedRevision, revision);
});

test("ordinary apply uses the exact durable reviewed plan and reconciles the approved resources", async () => {
  const providers = [new ReferenceProvider({ id: "vercel", families: ["agents", "connectors"] })];
  const store = new MemoryStateStore();
  const preview = await runReconciliation({ desiredRevision: revision, environment: "test", store, providerHandles: providers });
  const applied = await runReconciliation({
    operation: "apply",
    desiredRevision: revision,
    environment: "test",
    store,
    providerHandles: providers,
    expectedPlanId: preview.result.id,
    expectedPlanHash: preview.result.hash,
    approvedResourceIds: ["lily", "omniseed_os"],
    approverPrincipal: "reviewer"
  });
  const state = await store.load("omniseed_ecosystem");
  assert.deepEqual(state.deployed.map(item => item.id), ["lily", "omniseed_os"]);
  assert.equal(applied.reviewedPlan.id, preview.result.id);
  assert.equal(applied.reviewedPlan.hash, preview.result.hash);
  assert.equal(applied.approval.actorId, "operator_identities:reviewer");
  assert.equal(state.binding.desiredRevision, revision);
  assert.equal(state.binding.observedRevision, revision);
  assert.deepEqual(state.history.map(item => item.type), ["company_binding_recorded", "plan_generated", "plan_approved", "plan_applied", "reconciled"]);
});

test("ordinary apply fails closed for a stale hash, unknown resource, or absent durable plan", async () => {
  const providers = [new ReferenceProvider({ id: "vercel", families: ["agents", "connectors"] })];
  const store = new MemoryStateStore();
  const preview = await runReconciliation({ desiredRevision: revision, environment: "test", store, providerHandles: providers });
  await assert.rejects(runReconciliation({
    operation: "apply", desiredRevision: revision, environment: "test", store, providerHandles: providers,
    expectedPlanId: preview.result.id, expectedPlanHash: "0".repeat(64), approvedResourceIds: ["lily"]
  }), /exact persisted reviewed plan/);
  await assert.rejects(runReconciliation({
    operation: "apply", desiredRevision: revision, environment: "test", store, providerHandles: providers,
    expectedPlanId: preview.result.id, expectedPlanHash: preview.result.hash, approvedResourceIds: ["not_declared"]
  }), /absent from the reviewed plan/);
  await assert.rejects(runReconciliation({
    operation: "apply", desiredRevision: revision, environment: "test", store: new MemoryStateStore(), providerHandles: providers,
    expectedPlanId: preview.result.id, expectedPlanHash: preview.result.hash, approvedResourceIds: ["lily"]
  }), /exact persisted reviewed plan/);
});

test("initial bootstrap preview uses the same empty state as bootstrap without contacting the not-yet-deployed state service", async () => {
  const preview = await runReconciliation({
    desiredRevision: revision,
    environment: "test",
    bootstrapPreview: true,
    protocolProviders: []
  });
  const ordinaryEmptyPreview = await runReconciliation({
    desiredRevision: revision,
    environment: "test",
    store: new MemoryStateStore(),
    protocolProviders: []
  });
  assert.equal(preview.result.id, ordinaryEmptyPreview.result.id);
  assert.equal(preview.result.hash, ordinaryEmptyPreview.result.hash);
  await assert.rejects(runReconciliation({
    operation: "observe",
    desiredRevision: revision,
    bootstrapPreview: true,
    protocolProviders: []
  }), /valid only for the plan operation/);
});

test("bootstrap fails closed before Provider mutation for a stale plan or non-empty durable state", async () => {
  const providers = [new ReferenceProvider({ id: "vercel", families: ["agents", "connectors"] })];
  const preview = await runReconciliation({ desiredRevision: revision, environment: "test", store: new MemoryStateStore(), providerHandles: providers });
  await assert.rejects(runReconciliation({
    operation: "bootstrap", desiredRevision: revision, environment: "test", store: new MemoryStateStore(), durableStore: new MemoryStateStore(), providerHandles: providers,
    expectedPlanId: preview.result.id, expectedPlanHash: "0".repeat(64), approvedResourceIds: ["lily"]
  }), /does not match/);
  const occupied = new MemoryStateStore();
  await occupied.save({ ...(await occupied.load("omniseed_ecosystem")), history: [{ type: "existing" }] }, 0);
  await assert.rejects(runReconciliation({
    operation: "bootstrap", desiredRevision: revision, environment: "test", store: new MemoryStateStore(), durableStore: occupied, providerHandles: providers,
    expectedPlanId: preview.result.id, expectedPlanHash: preview.result.hash, approvedResourceIds: ["lily"]
  }), /only when the durable company runtime state is empty/);
});

test("production diagnostics expose only safe Provider failure coordinates", () => {
  const rendered = formatReconciliationError({
    code: "provider_remote_error",
    message: "Remote endpoint returned an error",
    details: { method: "provider.apply", remote: { data: { code: "remote_http_error", status: 400, host: "api.vercel.com", token: "must-not-appear" } } }
  });
  assert.deepEqual(JSON.parse(rendered), {
    code: "provider_remote_error",
    message: "Remote endpoint returned an error",
    provider: { method: "provider.apply", code: "remote_http_error", status: 400, host: "api.vercel.com" }
  });
  assert.doesNotMatch(rendered, /must-not-appear|token/);
});
