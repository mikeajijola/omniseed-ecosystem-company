import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { productionProviderConfiguration } from "../scripts/provider-configuration.mjs";

test("production Provider configuration uses organisation Providers and credential references only", () => {
  const providers = productionProviderConfiguration({
    OMNISEED_PROVIDER_ROOT: "/providers",
    OMNISEED_DESIRED_REVISION: "a".repeat(40),
    VERCEL_TEAM_ID: "team_1",
    VERCEL_STATUS_PROJECT_ID: "omniseed-ecosystem-os",
    NEON_PROJECT_ID: "quiet-tree-123",
    VERCEL_TOKEN: "must-not-appear",
    NEON_API_KEY: "must-not-appear",
    DATABASE_URL: "must-not-appear"
  });
  assert.deepEqual(providers.map(item => item.id), ["github", "vercel", "neon", "omniseed"]);
  const serialized = JSON.stringify(providers);
  assert.doesNotMatch(serialized, /must-not-appear/);
  assert.doesNotMatch(serialized, /provider-eve|github-actions-provider|vercel-functions-provider/);
  assert.equal(providers.find(item => item.id === "vercel").configuration.desiredRevision, "a".repeat(40));
  assert.equal(providers.find(item => item.id === "vercel").configuration.statusProjectId, "omniseed-ecosystem-os");
  for (const provider of providers) {
    assert.equal(provider.startupTimeoutMs, 15_000, `${provider.id} must tolerate production process startup latency`);
    assert.equal(provider.requestTimeoutMs, 360_000, `${provider.id} must permit declared Provider readiness waits`);
  }
});

test("Omnicede is installed only when a durable database path is explicitly supplied", () => {
  assert.equal(productionProviderConfiguration({ OMNISEED_PROVIDER_ROOT: "/providers", OMNISEED_DESIRED_REVISION: "a".repeat(40) }).some(item => item.id === "omnicede"), false);
  const configured = productionProviderConfiguration({ OMNISEED_PROVIDER_ROOT: "/providers", OMNISEED_DESIRED_REVISION: "a".repeat(40), OMNICEDE_DATABASE_PATH: "/durable/omniseed.db" });
  const omnicede = configured.find(item => item.id === "omnicede");
  assert.equal(omnicede.configuration.databasePath, "/durable/omniseed.db");
  assert.equal(omnicede.startupTimeoutMs, 15_000);
  assert.equal(omnicede.requestTimeoutMs, 360_000);
});

test("production reconciliation fails closed on Vercel identity and project scope without exposing credential material", async () => {
  const workflow = await readFile(new URL("../.github/workflows/reconcile.yml", import.meta.url), "utf8");
  assert.match(workflow, /projects\/\$\{VERCEL_STATUS_PROJECT_ID\}\?teamId=\$\{VERCEL_TEAM_ID\}/);
  assert.match(workflow, /--output \/dev\/null/);
  assert.match(workflow, /secrets\.VERCEL_TOKEN/);
  assert.doesNotMatch(workflow, /echo[^\n]*VERCEL_TOKEN/);
});
