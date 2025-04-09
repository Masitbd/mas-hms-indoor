import { model, Schema } from "mongoose";
import { TDesease } from "./desesse.interface";

const deseaseSchema = new Schema<TDesease>({
  name: { type: String, unique: true, required: true },
});

export const Desease = model("Desease", deseaseSchema);
