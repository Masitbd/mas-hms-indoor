import mongoose, { model, Schema } from "mongoose";
import { TPAdmission } from "./admission.interface";

const admissionSchema = new Schema<TPAdmission>({
  regNo: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  gender: { type: String, enum: ["male", "female", "others"], required: true },
  fatherName: { type: String },
  presentAddress: { type: String },
  permanentAddress: { type: String },
  age: { type: String },
  bloodGroup: { type: String },
  status: { type: String, enum: ["admitted", "released"], default: "admitted" },
  releaseDate: { type: Date },

  maritalStatus: {
    type: String,
    enum: ["married", "unmarried", "devorced", "single"],
  },
  occupation: { type: String },
  education: { type: String },
  district: { type: String },
  religion: { type: String },
  residence: { type: String },
  citizenShip: { type: String },
  allocatedBed: { type: mongoose.Types.ObjectId },
  paymentId: { type: mongoose.Types.ObjectId, ref: "Payment" },
});

export const Admission = model("Admission", admissionSchema);
