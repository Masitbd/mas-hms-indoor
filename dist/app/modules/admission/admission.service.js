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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdmissionServices = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const generateRegId_1 = require("../../utils/generateRegId");
const bed_model_1 = require("../beds/bed.model");
const payment_model_1 = require("../payments/payment.model");
const admission_model_1 = require("./admission.model");
const createAdmissionIntoDB = (paylaod) => __awaiter(void 0, void 0, void 0, function* () {
    const regNo = yield (0, generateRegId_1.generateRegId)();
    const { paymentInfo } = paylaod;
    paymentInfo.patientRegNo = regNo;
    const createPayment = yield payment_model_1.Payment.create(paymentInfo);
    paylaod.regNo = regNo;
    paylaod.paymentId = createPayment._id;
    const reuslt = yield admission_model_1.Admission.create(paylaod);
    return reuslt;
});
// ? get single
const getAdmissionInfoFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const aggregatePipeline = [
        {
            $match: { _id: new mongoose_1.default.Types.ObjectId(id) },
        },
        // look up beds info
        {
            $lookup: {
                from: "beds",
                localField: "allocatedBed",
                foreignField: "_id",
                as: "bedInfo",
            },
        },
        {
            $unwind: { path: "bedInfo", preserveNullAndEmptyArrays: true },
        },
        {
            $addFields: {
                allocatedBedDetails: {
                    $filter: {
                        input: "$bedInfo.beds", // Access the array inside the beds collection
                        as: "bed",
                        cond: { $eq: ["$$bed.isAllocated", true] }, // Get only allocated beds
                    },
                },
            },
        },
        // ? payment info
        {
            $lookup: {
                from: "payments",
                localField: "paymentId",
                foreignField: "_id",
                as: "paymentInfo",
            },
        },
        {
            $unwind: { path: "paymentInfo", preserveNullAndEmptyArrays: true },
        },
        {
            $project: {
                _id: 1,
                allocatedBed: 1,
                paymentId: 1,
                "bedInfo.worldName": 1,
                "bedInfo.charge": 1,
                "bedInfo.fees": 1,
                allocatedBedDetails: 1,
                "paymentInfo._id": 1,
                "paymentInfo.totalAmount": 1,
                "paymentInfo.totalPaid": 1,
                "paymentInfo.dueAmount": 1,
                "paymentInfo.payments": 1,
                "paymentInfo.createdAt": 1,
            },
        },
    ];
    const result = yield admission_model_1.Admission.aggregate(aggregatePipeline);
});
// update admission
const updateAdmissonIntoDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admission_model_1.Admission.findByIdAndUpdate(id, payload, { new: true });
    return result;
});
const deleteAdmissionFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admission_model_1.Admission.findByIdAndDelete(id);
    if (result) {
        yield payment_model_1.Payment.findOneAndDelete({ patientRegNo: result.regNo });
        yield bed_model_1.Bed.findOneAndUpdate({
            "beds._id": result.allocatedBed,
        }, {
            isAllocated: false,
        }, {
            new: true,
        });
    }
});
exports.AdmissionServices = {
    getAdmissionInfoFromDB,
    createAdmissionIntoDB,
    updateAdmissonIntoDB,
    deleteAdmissionFromDB,
};
