"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payment = void 0;
const mongoose_1 = require("mongoose");
const paymentArray = new mongoose_1.Schema({
    amount: { type: Number, default: 0, required: true },
    discount: { type: Number },
    disCountBy: { type: Number },
    purpose: { type: String, enum: ["due-collection", "payment"] },
    receivedBy: { type: String, index: true, required: true },
}, {
    _id: false,
    timestamps: true,
});
const paymentSchema = new mongoose_1.Schema({
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
    discountAmount: { type: Number, default: 0 },
    payments: [paymentArray],
}, {
    timestamps: true,
});
paymentSchema.pre("save", function (next) {
    // Check if payments array is modified
    if (!this.isModified("payments") && !this.isNew)
        return next();
    // Recalculate totalPaid
    this.totalPaid = this.payments.reduce((acc, payment) => {
        return acc + (payment.amount - (payment.discount || 0));
    }, 0);
    // Recalculate dueAmount
    this.dueAmount = Math.max(0, this.totalAmount - (this.totalPaid + (this.transferAmount || 0)));
    next();
});
exports.Payment = (0, mongoose_1.model)("Payment", paymentSchema);
