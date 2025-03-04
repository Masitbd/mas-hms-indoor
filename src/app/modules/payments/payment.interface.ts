import { Schema } from "mongoose";

export type TPaymentArray = {
  amount: number;
  discount?: number;
  disCountBy?: string;
};

export type TPayments = {
  patientRegNo: string;
  transferAmount: number;
  totalAmount: number;
  totalPaid: number;
  dueAmount: number;
  payments: TPaymentArray[];
};
