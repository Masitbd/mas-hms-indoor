import mongoose, { model, Schema } from "mongoose";
import { TPaymentArray, TPayments } from "./payment.interface";

const paymentArray = new Schema<TPaymentArray>(
  {
    amount: { type: Number, default: 0, required: true },
    discount: { type: Number },
    disCountBy: { type: Number },
  },
  {
    timestamps: true,
  }
);

const paymentSchema = new Schema<TPayments>(
  {
    patientId: {
      type: mongoose.Types.ObjectId,
      ref: "Admission",
      required: true,
    },

    totalAmount: { type: Number, required: true },
    totalPaid: { type: Number, default: 0 },
    dueAmount: { type: Number, required: true },

    payments: [paymentArray],
  },
  {
    timestamps: true,
  }
);

paymentSchema.pre("save", function (next) {
  if (!this.isModified("payments")) return next(); // Only update if payments array is modified

  // Sum up all payments (amount - discount)
  this.totalPaid = this.payments.reduce((acc, payment) => {
    return acc + (payment.amount - (payment.discount || 0));
  }, 0);

  // Calculate remaining due amount
  this.dueAmount = Math.max(0, this.totalAmount - this.totalPaid);

  next();
});

export const Payment = model("Payment", paymentSchema);
