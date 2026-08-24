#!/usr/bin/env node

const allowed = new Set([
  "inspect_company_change",
  "approve_company_change",
  "apply_company_change",
  "merge_company_change",
  "observe_company",
]);

export async function invokeGovernedOperation({ operation, inputJson = "{}", endpoint, credential, fetchImpl = fetch } = {}) {
  if (!allowed.has(operation)) throw new Error("Operation is not permitted by the production operator dispatch.");
  if (!endpoint?.startsWith("https://")) throw new Error("A secure OmniSeed operation endpoint is required.");
  if (typeof credential !== "string" || credential.length < 32) throw new Error("The server-side operator credential is unavailable.");
  let input;
  try { input = JSON.parse(inputJson); } catch { throw new Error("Operation input must be valid JSON."); }
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Operation input must be a JSON object.");
  const response = await fetchImpl(`${endpoint.replace(/\/$/, "")}/api/operations/${operation}:invoke`, {
    method: "POST",
    headers: { accept: "application/json", authorization: `Bearer ${credential}`, "content-type": "application/json" },
    body: JSON.stringify({ input }),
  });
  let payload;
  try { payload = await response.json(); } catch { throw new Error("OmniSeed returned a non-JSON operation response."); }
  if (!response.ok || payload?.ok === false) throw new Error(`Governed operation failed (${payload?.code ?? response.status}): ${payload?.error ?? "unknown error"}`);
  return payload;
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const result = await invokeGovernedOperation({
    operation: process.env.OMNISEED_OPERATION,
    inputJson: process.env.OMNISEED_OPERATION_INPUT ?? "{}",
    endpoint: process.env.OMNISEED_OPERATION_ENDPOINT,
    credential: process.env.OMNISEED_OPERATOR_TOKEN,
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
