import assert from "node:assert/strict";
import test from "node:test";
import { invokeGovernedOperation } from "../scripts/invoke-operation.mjs";

const credential = "operator-token-at-least-thirty-two-characters";

test("operator dispatch invokes only an allowlisted ordinary operation", async () => {
  let request;
  const result = await invokeGovernedOperation({ operation: "approve_company_change", inputJson: '{"proposalId":"change_1","proposalHash":"abc"}', endpoint: "https://omniseed.example.test", credential, fetchImpl: async (url, init) => { request = { url, init }; return Response.json({ ok: true, result: { status: "approved" } }); } });
  assert.equal(result.result.status, "approved");
  assert.match(request.url, /\/api\/operations\/approve_company_change:invoke$/);
  assert.deepEqual(JSON.parse(request.init.body), { input: { proposalId: "change_1", proposalHash: "abc" } });
  assert.equal(request.init.headers.authorization, `Bearer ${credential}`);
});

test("operator dispatch permits proposals through the ordinary Company Change operation", async () => {
  let request;
  const result = await invokeGovernedOperation({ operation: "propose_company_change", inputJson: '{"reason":"Declare the reviewed runtime revision.","patch":[]}', endpoint: "https://omniseed.example.test", credential, fetchImpl: async (url, init) => { request = { url, init }; return Response.json({ ok: true, result: { status: "proposed" } }); } });
  assert.equal(result.result.status, "proposed");
  assert.match(request.url, /\/api\/operations\/propose_company_change:invoke$/);
  assert.deepEqual(JSON.parse(request.init.body), { input: { reason: "Declare the reviewed runtime revision.", patch: [] } });
});

test("operator dispatch rejects arbitrary operations, malformed input, and missing credentials", async () => {
  await assert.rejects(invokeGovernedOperation({ operation: "github.api", inputJson: "{}", endpoint: "https://omniseed.example.test", credential }), /not permitted/);
  await assert.rejects(invokeGovernedOperation({ operation: "observe_company", inputJson: "not-json", endpoint: "https://omniseed.example.test", credential }), /valid JSON/);
  await assert.rejects(invokeGovernedOperation({ operation: "observe_company", inputJson: "{}", endpoint: "https://omniseed.example.test", credential: "weak" }), /unavailable/);
});

test("operator dispatch fails closed on operation errors", async () => {
  await assert.rejects(invokeGovernedOperation({ operation: "merge_company_change", inputJson: "{}", endpoint: "https://omniseed.example.test", credential, fetchImpl: async () => Response.json({ ok: false, code: "authorization_denied", error: "Denied" }, { status: 403 }) }), /authorization_denied/);
});
