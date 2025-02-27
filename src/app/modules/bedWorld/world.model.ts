import { model, Schema } from "mongoose";
import { TWorld } from "./world.interface";

const bedWorldSchema = new Schema<TWorld>(
  {
    worldName: { type: String, required: true, unique: true },
    charge: { type: Number, required: true },
    fees: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

export const BedWorld = model("BedWorld", bedWorldSchema);
