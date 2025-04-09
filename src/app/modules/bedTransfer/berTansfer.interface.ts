import { Schema } from "mongoose";

export type TBedTransfer = {
  patientId: Schema.Types.ObjectId;
  previousBed: Schema.Types.ObjectId;
  admissionDate: string;
  newBed: Schema.Types.ObjectId;
  totalAmount: number;
  dayStayed: number;
};
