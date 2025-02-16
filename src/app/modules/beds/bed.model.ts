import { model, Schema } from "mongoose";
import { TBeds } from "./bed.interface";

const allocatBedScheam = new Schema({
  bedName: { type: String },
  isAllocated: { type: Boolean, default: false },
  phone: { type: String },
  floor: { type: String },
});

const bedSchema = new Schema<TBeds>(
  {
    worldName: { type: String, required: true, unique: true },
    charge: { type: Number, required: true },
    fees: { type: Number, required: true },
    beds: [allocatBedScheam],
  },
  {
    timestamps: true,
  }
);

export const Bed = model("Bed", bedSchema);
