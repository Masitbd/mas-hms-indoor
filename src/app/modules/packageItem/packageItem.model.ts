import { model, Schema } from "mongoose";
import { TPackage } from "./packageItem.interface";

const packageItemSchema = new Schema<TPackage>({
  name: { type: String, required: true, unique: true },
  price: { type: Number, required: true },
});

export const PackageItem = model("PackageItem", packageItemSchema);
