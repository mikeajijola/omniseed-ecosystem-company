import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { loadOmniform } from "@omniseed/omniform";
import { capabilityProjectionFixture } from "../scripts/capability-projection.mjs";

test("the canonical company declares the wider operating business without invented realisations", async () => {
  const declaration = await loadOmniform(new URL("../omniform.yaml", import.meta.url));
  assert.equal(declaration.spec.capabilities.length, 25);
  assert.equal(declaration.spec.realisations.length, 5);
  assert.equal(declaration.spec.capabilities.filter(item => item.realisations?.length).length, 5);
  for (const capability of declaration.spec.capabilities) {
    assert.ok(capability.description, `${capability.id} must state its intent`);
    assert.ok(capability.requires.every(requirement => requirement.id && requirement.primitiveFamily));
  }
});
test("the OS projection fixture is generated from the canonical declaration and preserves mixed state semantics", async () => {
  const expected = JSON.parse(await readFile(new URL("../docs/fixtures/capability-projection.json", import.meta.url), "utf8"));
  const actual = await capabilityProjectionFixture();
  assert.deepEqual(actual, expected);
  assert.deepEqual(actual.summary, { realised: 5, partial: 1, missing: 19 });
  assert.equal(actual.authoritativeObservation, false);
});
