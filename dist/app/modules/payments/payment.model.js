"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const mongoose_1 = require("mongoose");
const paymentArray = new mongoose_1.Schema({
    amount: { type: Number, default: 0, required: true },
    discount: { type: Number },
    disCountBy: { type: Number },
}, {
    timestamps: true,
});
const paymentSchema = new mongoose_1.Schema({
    patientRegNo: {
        type: String,
        required: true,
    },
    transferAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true, default: 0 },
    totalPaid: { type: Number, default: 0 },
    dueAmount: { type: Number, required: true, default: 0 },
    payments: [paymentArray],
}, {
    timestamps: true,
});
paymentSchema.pre("save", function (next) {
    if (!this.isModified("payments"))
        return next(); // Only update if payments array is modified
    this.totalPaid = this.payments.reduce((acc, payment) => {
        return acc + (payment.amount - (payment.discount || 0));
    }, 0);
    this.dueAmount = Math.max(0, this.totalAmount - (this.totalPaid + this.transferAmount));
    next();
});
exports.Payment = (0, mongoose_1.model)("Payment", paymentSchema);
