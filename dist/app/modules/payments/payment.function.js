"use strict";
// utils/paymentHelper.js
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addPayment = addPayment;
const payment_model_1 = require("./payment.model");
function addPayment(regNo, payload) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const payment = yield payment_model_1.Payment.findOne({ patientRegNo: regNo });
        if (!payment) {
            throw new Error("Payment record not found");
        }
        // Push new payment
        payment.payments.push(Object.assign(Object.assign({}, payload), { amount: (_a = payload.amount) !== null && _a !== void 0 ? _a : 0, discount: (_b = payload.discount) !== null && _b !== void 0 ? _b : 0, purpose: payload.purpose || "payment", disCountBy: payload.disCountBy || "", receivedBy: payload.receivedBy }));
        // Recalculate totalPaid
        payment.totalPaid = payment.payments.reduce((acc, payment) => acc + (payment.amount - (payment.discount || 0)), 0);
        // Recalculate dueAmount
        payment.dueAmount = Math.max(0, payment.totalAmount - (payment.totalPaid || 0));
        return payment;
    });
}
