import { model, Schema } from "mongoose";
import { TBedAllocation } from "./bed.interface";

const bedSchema = new Schema<TBedAllocation>(
  {
    bedName: { type: String, required: true, unique: true },
    isAllocated: { type: Boolean, default: false },
    phone: { type: String },
    floor: { type: String },
    worldId: { type: Schema.Types.ObjectId, ref: "BedWorld" },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

export const Bed = model("Bed", bedSchema);
