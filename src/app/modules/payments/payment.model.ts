import { model, Schema } from "mongoose";
import { TPaymentArray, TPayments } from "./payment.interface";

const paymentArray = new Schema<TPaymentArray>(
  {
    amount: { type: Number, default: 0, required: true },
    discount: { type: Number },
    disCountBy: { type: Number },
    purpose: { type: String, enum: ["due-collection", "payment"] },
    receivedBy: { type: String, index: true, required: true },
  },
  {
    _id: false,
    timestamps: true,
  }
);

const paymentSchema = new Schema<TPayments>(
  {
    patientRegNo: {
      type: String,

      required: true,
      index: true,
    },
    transferAmount: { type: Number, default: 0 },
    serviceAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    totalPaid: { type: Number, default: 0 },
    dueAmount: { type: Number, required: true, default: 0 },

    payments: [paymentArray],
  },
  {
    timestamps: true,
  }
);

paymentSchema.pre("save", function (next) {
  // Check if payments array is modified
  if (!this.isModified("payments") && !this.isNew) return next();

  // Recalculate totalPaid
  this.totalPaid = this.payments.reduce((acc, payment) => {
    return acc + (payment.amount - (payment.discount || 0));
  }, 0);

  // Recalculate dueAmount
  this.dueAmount = Math.max(
    0,
    this.totalAmount - (this.totalPaid + (this.transferAmount || 0))
  );

  next();
});

export const Payment = model("Payment", paymentSchema);
