import assert from "node:assert/strict";
import test from "node:test";
import { computePaymentStatus } from "./paymentStatus.js";

test("marks payment as PAID when amountPaid >= amountDue", () => {
  const status = computePaymentStatus({ amountDue: 120, amountPaid: 120 });
  assert.equal(status, "PAID");
});

test("marks payment as PARTIAL when some amount is paid", () => {
  const status = computePaymentStatus({ amountDue: 120, amountPaid: 60 });
  assert.equal(status, "PARTIAL");
});

test("marks payment as OUTSTANDING when no payment and not overdue", () => {
  const dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const status = computePaymentStatus({ amountDue: 120, amountPaid: 0, dueDate });
  assert.equal(status, "OUTSTANDING");
});

test("allows explicit WAIVED override", () => {
  const status = computePaymentStatus({ amountDue: 120, amountPaid: 0, explicitStatus: "WAIVED" });
  assert.equal(status, "WAIVED");
});
