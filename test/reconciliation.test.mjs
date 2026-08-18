import test from "node:test";
import assert from "node:assert/strict";
import { MemoryStateStore } from "@omniseed/engine";
import { loadOmniform } from "@omniseed/omniform";
import { runReconciliation } from "../scripts/reconcile.mjs";

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
