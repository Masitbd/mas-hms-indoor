import mongoose, { model, Schema } from "mongoose";
import { TPAdmission, TPatientService } from "./admission.interface";
import { Payment } from "../payments/payment.model";

const patientServiceSchema = new Schema<TPatientService>(
  {
    serviceCategory: { type: String },
    allocatedBed:{type:String},
    doctorId:{type:String},
    seriveId: { type: String },
    servicedBy: { type: String },
    amount: { type: Number },
  },
  {
    _id: false,
    timestamps: true,
  }
);

const admissionSchema = new Schema<TPAdmission>(
  {
    regNo: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    gender: {
      type: String,
      enum: ["Male", "Female", "Others"],
      required: true,
    },
    fatherName: { type: String },
    presentAddress: { type: String },
    permanentAddress: { type: String },
    age: { type: String },
    bloodGroup: { type: String },
    status: {
      type: String,
      enum: ["admitted", "released"],
      default: "admitted",
    },
    admissionDate: { type: String },
    admissionTime: { type: String },
    assignDoct: { type: Schema.Types.ObjectId, ref: "Doctor" },
    refDoct: { type: Schema.Types.ObjectId, ref: "Doctor" },
    releaseDate: { type: String },

    maritalStatus: {
      type: String,
    },
    occupation: { type: String },
    education: { type: String },
    district: { type: String },
    religion: { type: String },
    residence: { type: String },
    citizenShip: { type: String },
    disease: { type: String },
    isTransfer: { type: Boolean },
    tranferInfo: { type: Schema.Types.ObjectId },
    firstAdmitDate: { type: String },
    allocatedBed: { type: mongoose.Types.ObjectId, ref: "Bed" },
    paymentId: { type: mongoose.Types.ObjectId, ref: "Payment" },
    services: [patientServiceSchema],
    fixedBill: { type: Schema.Types.ObjectId, ref: "PackageItem" },
  },
  {
    timestamps: true,
  }
);

admissionSchema.post("save", async function () {
  const totalAmount = this.services.reduce(
    (acc, service) => acc + (service.amount || 0),
    0
  );

  await Payment.findOneAndUpdate(
    { patientRegNo: this.regNo },
    { $set: { totalAmount } }
  );
});

export const Admission = model("Admission", admissionSchema);
