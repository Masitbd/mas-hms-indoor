// utils/paymentHelper.js

import { Schema } from "mongoose";
import { Payment } from "./payment.model";
import { TPaymentArray } from "./payment.interface";

export async function addPayment(
  regNo: string,
  payload: Partial<TPaymentArray>
) {
  const payment = await Payment.findOne({ patientRegNo: regNo });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  // Push new payment
  payment.payments.push({
    ...payload,
    amount: payload.amount ?? 0,
    discount: payload.discount ?? 0,
    purpose: payload.purpose || "payment",
    disCountBy: payload.disCountBy || "",
    receivedBy: payload.receivedBy,
  });

  // Recalculate totalPaid
  payment.totalPaid = payment.payments.reduce(
    (acc, payment) => acc + (payment.amount - (payment.discount || 0)),
    0
  );

  // Recalculate dueAmount
  payment.dueAmount = Math.max(
    0,
    payment.totalAmount - (payment.totalPaid || 0)
  );

  return payment;
}
