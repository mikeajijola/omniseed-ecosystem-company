import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { parseOmniform } from "@omniseed/omniform";
import { productionProviderConfiguration } from "../scripts/provider-configuration.mjs";

test("production Provider configuration uses organisation Providers and credential references only", () => {
  const providers = productionProviderConfiguration({
    OMNISEED_PROVIDER_ROOT: "/providers",
    OMNISEED_DESIRED_REVISION: "a".repeat(40),
    OMNISEED_GOOGLE_PROVIDER_REVISION: "b".repeat(40),
    VERCEL_TEAM_ID: "team_1",
    VERCEL_STATUS_PROJECT_ID: "omniseed-ecosystem-os",
    NEON_PROJECT_ID: "quiet-tree-123",
    VERCEL_TOKEN: "must-not-appear",
    NEON_API_KEY: "must-not-appear",
    DATABASE_URL: "must-not-appear"
  });
  assert.deepEqual(providers.map(item => item.id), ["github", "vercel", "neon", "omniseed", "google"]);
  const serialized = JSON.stringify(providers);
  assert.doesNotMatch(serialized, /must-not-appear/);
  assert.doesNotMatch(serialized, /provider-eve|github-actions-provider|vercel-functions-provider/);
  assert.equal(providers.find(item => item.id === "vercel").configuration.desiredRevision, "a".repeat(40));
  assert.equal(providers.find(item => item.id === "vercel").configuration.statusProjectId, "omniseed-ecosystem-os");
  assert.deepEqual(providers.find(item => item.id === "github").configuration.mergePolicy.trustedApprovalChecks, [
    { name: "governed-company-change-approval", appSlug: "github-actions" }
  ]);
  assert.deepEqual(providers.find(item => item.id === "google").configuration.credentialReferenceEnvironment, {
    GOOGLE_GENERATIVE_AI_API_KEY: "GOOGLE_GENERATIVE_AI_API_KEY"
  });
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

test("production reconciliation resolves and installs exact declared Provider revisions", async () => {
  const [workflow, company] = await Promise.all([
    readFile(new URL("../.github/workflows/reconcile.yml", import.meta.url), "utf8"),
    readFile(new URL("../omniform.yaml", import.meta.url), "utf8")
  ]);
  const revision = company.match(/id: company_change_workflow[\s\S]*?providerRevision: ([0-9a-f]{40})/)?.[1];
  assert.ok(revision);
  assert.match(workflow, /node scripts\/provider-revisions\.mjs >> "\$GITHUB_OUTPUT"/);
  assert.match(workflow, /repository: mikeajijola\/omniseed-provider-github, ref: "\$\{\{ steps\.provider-revisions\.outputs\.github \}\}"/);
  assert.match(workflow, /repository: mikeajijola\/omniseed-provider-google, ref: "\$\{\{ steps\.provider-revisions\.outputs\.google \}\}"/);
  const { declaredProviderRevision } = await import("../scripts/provider-revisions.mjs");
  assert.equal(declaredProviderRevision(parseOmniform(company), "github"), revision);
  assert.equal(declaredProviderRevision(parseOmniform(company), "google"), "a94e6101214d807897ca701e5b96050d7de054d7");
});

test("governed approval check is exact-head, same-repository, and protected", async () => {
  const workflow = await readFile(new URL("../.github/workflows/company-change-approval.yml", import.meta.url), "utf8");
  assert.match(workflow, /head\.repo\.full_name == github\.repository/);
  assert.match(workflow, /startsWith\(github\.event\.pull_request\.head\.ref, 'omniseed\/'\)/);
  assert.match(workflow, /ref: \$\{\{ github\.event\.pull_request\.head\.sha \}\}/);
  assert.match(workflow, /environment: production/);
  assert.match(workflow, /name: governed-company-change-approval/);
  assert.doesNotMatch(workflow, /secrets\./);
});
test("memory selections distinguish durable runtime state from organisational memory", async () => {
  const company = parse(await readFile(new URL("../omniform.yaml", import.meta.url), "utf8"));
  assert.equal(company.spec.providers.memory.provider, "neon");
  const resources = new Map(company.spec.resources.memory.map(item => [item.id, item]));
  assert.equal(resources.get("ecosystem_memory").provider, "omnicede");
  assert.deepEqual(resources.get("ecosystem_memory").offers, ["organisational_context", "engineering_history"]);
  assert.equal(resources.get("engine_runtime_state").provider, "neon");
  assert.deepEqual(resources.get("engine_runtime_state").offers, ["runtime_state_continuity"]);
  assert.equal(resources.get("ecosystem_memory").spec.expectedObservation.type, "omnicede_memory_state");
  assert.equal(resources.get("engine_runtime_state").spec.expectedObservation.type, "neon_memory_state");
});

test("identity selections preserve principal kinds and approval separation", async () => {
  const company = parse(await readFile(new URL("../omniform.yaml", import.meta.url), "utf8"));
  assert.equal(company.spec.providers.identity.provider, "github");
  const identities = new Map(company.spec.resources.identity.map(item => [item.id, item]));
  assert.deepEqual(
    Object.fromEntries([...identities].map(([id, item]) => [id, { provider: item.provider, kind: item.spec.kind }])),
    {
      lily_identity: { provider: "omniseed", kind: "agent" },
      contributor_identities: { provider: "github", kind: "human" },
      operator_identities: { provider: "github", kind: "human" },
      reconciler_identity: { provider: "github", kind: "service" }
    }
  );
  assert.deepEqual(identities.get("operator_identities").spec.authority, [
    "plan.approve", "company_change.approve", "company_change.apply", "company_change.merge"
  ]);
  assert.deepEqual(identities.get("reconciler_identity").spec.authority, [
    "company.bind", "plan.create", "plan.apply", "state.reconcile"
  ]);
  assert.equal(identities.get("reconciler_identity").spec.selfApproval, false);
  assert.equal(identities.get("reconciler_identity").spec.authority.includes("plan.approve"), false);
});
