import { model, Schema } from "mongoose";
import { TBedTransfer } from "./berTansfer.interface";

const bedTransferSchema = new Schema<TBedTransfer>({
  patientId: {
    type: Schema.Types.ObjectId,
    ref: "Admission",
    required: true,
    index: true,
  },
  transferInfo: [
    {
      previousBed: { type: Schema.Types.ObjectId, ref: "Bed", required: true },
      newBed: { type: Schema.Types.ObjectId, ref: "Bed", required: true },
      admissionDate: { type: String, required: true },
      totalAmount: { type: Number, required: true },
      dayStayed: { type: Number, required: true },
    },
  ],
});

export const TransferBed = model("TransferBed", bedTransferSchema);
