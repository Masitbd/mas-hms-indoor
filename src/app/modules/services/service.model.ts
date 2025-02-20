import { model, Schema } from "mongoose";
import { TServices } from "./service.interface";

const serviceSchema = new Schema<TServices>(
  {
    name: { type: String, required: true },
    rate: { type: Number, required: true },
    vat: { type: Number, required: true },
    isFixed: { type: Boolean, required: true, default: false },
    fixedRate: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      required: true,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

export const Service = model("Service", serviceSchema);
