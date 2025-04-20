import { Schema } from "mongoose";
import { TPatientService } from "../admission/admission.interface";

export type TPaymentArray = {
  amount: number;
  discount?: number;
  disCountBy?: string;
  purpose?: string;
  receivedBy?: Schema.Types.ObjectId;
};

export type TPayments = {
  patientRegNo: string;
  transferAmount: number;
  serviceAmount: number;
  totalAmount: number;
  totalPaid: number;
  dueAmount: number;
  payments: TPaymentArray[];
  services: [TPatientService];
};
