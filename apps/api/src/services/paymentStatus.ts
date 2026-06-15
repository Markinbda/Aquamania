import type { PaymentStatus } from "@prisma/client";

type Input = {
  amountDue: number;
  amountPaid: number;
  dueDate?: Date;
  explicitStatus?: PaymentStatus;
};

export function computePaymentStatus(input: Input): PaymentStatus {
  if (input.explicitStatus === "WAIVED") {
    return "WAIVED";
  }

  if (input.amountPaid <= 0) {
    if (input.dueDate && input.dueDate.getTime() < Date.now()) {
      return input.explicitStatus === "OVERDUE" ? "OVERDUE" : "OUTSTANDING";
    }
    return input.explicitStatus === "OVERDUE" ? "OVERDUE" : "OUTSTANDING";
  }

  if (input.amountPaid >= input.amountDue) {
    return "PAID";
  }

  if (input.dueDate && input.dueDate.getTime() < Date.now() && input.explicitStatus === "OVERDUE") {
    return "OVERDUE";
  }

  return "PARTIAL";
}
