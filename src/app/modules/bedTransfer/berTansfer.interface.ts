import { Schema } from "mongoose";

type TTranser = {
  previousBed: Schema.Types.ObjectId;
  admissionDate: string;
  newBed: Schema.Types.ObjectId;
  totalAmount: number;
  dayStayed: number;
};

export type TBedTransfer = {
  patientId: Schema.Types.ObjectId;
  transferInfo: [TTranser];
};
