import { Schema } from "mongoose";

export type TPaymentArray = {
  amount: number;
  discount?: number;
  disCountBy?: string;
};

export type TPayments = {
  patientId: Schema.Types.ObjectId;
  totalAmount: number;
  totalPaid: number;
  dueAmount: number;
  payments: TPaymentArray[];
};
