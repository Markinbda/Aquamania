import assert from "node:assert/strict";
import test from "node:test";
import { buildSignedConsentRecords, getRequiredConsentTypes, hasAllRequiredConsents } from "./consentLogic.js";

test("required consent list contains all four mandatory forms", () => {
  const required = getRequiredConsentTypes();
  assert.deepEqual(required, ["WATER_SAFETY", "PHOTO_CONSENT", "MEDICAL_CONSENT", "GENERAL"]);
});

test("hasAllRequiredConsents returns true for complete form set", () => {
  const ok = hasAllRequiredConsents(["WATER_SAFETY", "PHOTO_CONSENT", "MEDICAL_CONSENT", "GENERAL"]);
  assert.equal(ok, true);
});

test("hasAllRequiredConsents returns false if one form is missing", () => {
  const ok = hasAllRequiredConsents(["WATER_SAFETY", "PHOTO_CONSENT", "GENERAL"]);
  assert.equal(ok, false);
});

test("buildSignedConsentRecords creates one record per form", () => {
  const records = buildSignedConsentRecords("Parent Name", "127.0.0.1", ["WATER_SAFETY", "GENERAL"]);
  assert.equal(records.length, 2);
  assert.equal(records[0].signedByName, "Parent Name");
  assert.equal(records[0].ipAddress, "127.0.0.1");
});
