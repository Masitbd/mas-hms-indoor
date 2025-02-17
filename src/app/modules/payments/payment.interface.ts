import { Schema } from "mongoose";

export type TPaymentArray = {
  amount: number;
  discount?: number;
  disCountBy?: string;
};

export type TPayments = {
  patientRegNo: string;
  totalAmount: number;
  totalPaid: number;
  dueAmount: number;
  payments: TPaymentArray[];
};
