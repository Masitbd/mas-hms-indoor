"use strict";
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
exports.PaymentServices = void 0;
const payment_model_1 = require("./payment.model");
const journalEntry_service_1 = require("../journal-entry/journalEntry.service");
const getAllPayementInfoWithPatientInfoFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const aggregatePipeline = [
        {
            $lookup: {
                from: "admissions",
                localField: "patientRegNo",
                foreignField: "regNo",
                as: "patientInfo",
            },
        },
        {
            $unwind: { path: "$patientInfo", preserveNullAndEmptyArrays: true },
        },
        {
            $project: {
                totalAmount: 1,
                totalPaid: 1,
                dueAmount: 1,
                "patientInfo.name": 1,
                "patientInfo.age": 1,
                "patientInfo.status": 1,
                "patientInfo.createdAt": 1,
            },
        },
    ];
    const result = yield payment_model_1.Payment.aggregate(aggregatePipeline);
    return result;
});
// ? update a patient payment ==
const updatePaymentAUserIntoDB = (regNo, payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const payment = yield payment_model_1.Payment.findOne({ patientRegNo: regNo });
    if (!payment) {
        throw new Error("Payment record not found");
    }
    payment.payments.push({
        amount: payload.amount || 0,
        discount: payload.discount || 0,
        purpose: payload.purpose,
        disCountBy: payload.disCountBy || "",
        receivedBy: payload.receivedBy,
    });
    payment.totalPaid = payment.payments.reduce((acc, payment) => { var _a; return acc + (payment.amount - ((_a = payment.discount) !== null && _a !== void 0 ? _a : 0)); }, 0);
    // Recalculate dueAmount
    payment.dueAmount = Math.max(0, payment.totalAmount - (payment.totalPaid || 0));
    // Save the updated document
    yield payment.save();
    if ((payload === null || payload === void 0 ? void 0 : payload.purpose) == "due-collection") {
        yield journalEntry_service_1.journalEntryService.postJournalEntryForDueCollection({
            amount: (_a = payload.amount) !== null && _a !== void 0 ? _a : 0,
            token: "test",
        });
    }
    return payment;
});
const updatePatientDiscountInfoDB = (patientRegNo, payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield payment_model_1.Payment.findOneAndUpdate({ patientRegNo: patientRegNo }, { $inc: { discountAmount: payload.discountAmount } }, { new: true });
});
// export
exports.PaymentServices = {
    getAllPayementInfoWithPatientInfoFromDB,
    updatePaymentAUserIntoDB,
    updatePatientDiscountInfoDB,
};
