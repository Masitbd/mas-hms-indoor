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
const admission_constance_1 = require("./admission.constance");
const mongoose_1 = __importDefault(require("mongoose"));
const generateRegId_1 = require("../../utils/generateRegId");
const bed_model_1 = require("../beds/bed.model");
const payment_model_1 = require("../payments/payment.model");
const admission_model_1 = require("./admission.model");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const createAdmissionIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession(); // Start transaction session
    session.startTransaction();
    try {
        const regNo = yield (0, generateRegId_1.generateRegId)();
        payload.patientRegNo = regNo;
        if (payload.isTransfer === "") {
            payload.isTransfer = false;
        }
        const createPayment = yield payment_model_1.Payment.create([Object.assign({}, payload)], { session });
        payload.regNo = regNo;
        payload.paymentId = createPayment[0]._id;
        const result = yield admission_model_1.Admission.create([Object.assign({}, payload)], { session });
        yield bed_model_1.Bed.findByIdAndUpdate(payload.allocatedBed, { isAllocated: true }, { new: true, session });
        yield session.commitTransaction();
        session.endSession();
        return result[0];
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error; // Ensure the error is propagated
    }
});
// ? get all admission
const getAllAdmissionFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const admissionQuery = new QueryBuilder_1.default(admission_model_1.Admission.find()
        .select("regNo name admissionDate admissionTime allocatedBed status")
        .populate("allocatedBed", "bedName"), query)
        .search(admission_constance_1.admissonSearchableFields)
        .filter()
        .sort()
        .paginate();
    const meta = yield admissionQuery.countTotal();
    const result = yield admissionQuery.modelQuery;
    return {
        meta,
        result,
    };
});
// ? get single
const getAdmissionInfoFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const aggregatePipeline = [
        {
            $match: { _id: new mongoose_1.default.Types.ObjectId(id) },
        },
        // Lookup bed information
        {
            $lookup: {
                from: "beds",
                localField: "allocatedBed",
                foreignField: "_id",
                as: "bedInfo",
            },
        },
        {
            $unwind: { path: "$bedInfo", preserveNullAndEmptyArrays: true },
        },
        // Lookup world information from worldId in bedInfo
        {
            $lookup: {
                from: "bedworlds",
                localField: "bedInfo.worldId",
                foreignField: "_id",
                as: "worldInfo",
            },
        },
        {
            $unwind: { path: "$worldInfo", preserveNullAndEmptyArrays: true },
        },
        {
            $addFields: {
                allocatedBedDetails: {
                    _id: "$bedInfo._id",
                    bedName: "$bedInfo.bedName",
                    isAllocated: "$bedInfo.isAllocated",
                    phone: "$bedInfo.phone",
                    floor: "$bedInfo.floor",
                    world: {
                        fees: "$worldInfo.fees",
                        worldName: "$worldInfo.worldName",
                        charge: "$worldInfo.charge",
                    },
                },
            },
        },
        // Convert admissionDate and admissionTime to Date format
        {
            $addFields: {
                admissionDateConverted: { $toDate: "$admissionDate" },
                admissionTimeConverted: { $toDate: "$admissionTime" },
            },
        },
        // Calculate the number of full days stayed
        {
            $addFields: {
                daysStayed: {
                    $add: [
                        {
                            $dateDiff: {
                                startDate: "$admissionDateConverted",
                                endDate: "$$NOW",
                                unit: "day",
                            },
                        },
                        {
                            $cond: {
                                if: {
                                    $gte: [{ $hour: "$admissionTimeConverted" }, 12],
                                },
                                then: 1,
                                else: 0,
                            },
                        },
                    ],
                },
            },
        },
        {
            $lookup: {
                from: "payments",
                localField: "paymentId",
                foreignField: "_id",
                as: "paymentInfo",
            },
        },
        {
            $unwind: { path: "$paymentInfo", preserveNullAndEmptyArrays: true },
        },
        {
            $addFields: {
                totalAmount: {
                    $cond: {
                        if: { $eq: ["$daysStayed", 0] },
                        then: "$worldInfo.charge",
                        else: {
                            $add: [
                                { $multiply: ["$daysStayed", "$worldInfo.fees"] },
                                { $ifNull: ["$paymentInfo.totalAmount", 0] },
                            ],
                        },
                    },
                },
            },
        },
        // Project only necessary fields
        {
            $project: {
                _id: 1,
                allocatedBed: 1,
                paymentId: 1,
                allocatedBedDetails: 1,
                totalAmount: 1,
                daysStayed: 1,
                "paymentInfo._id": 1,
                "paymentInfo.totalAmount": 1,
                "paymentInfo.totalPaid": 1,
                "paymentInfo.dueAmount": 1,
                "paymentInfo.payments": 1,
                "paymentInfo.createdAt": 1,
                admissionDate: 1,
                admissionTime: 1,
                regNo: 1,
                name: 1,
                status: 1,
                isTransfer: 1,
            },
        },
    ];
    const result = yield admission_model_1.Admission.aggregate(aggregatePipeline);
    return result;
});
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
//
const realeasePatientFromDB = (option) => __awaiter(void 0, void 0, void 0, function* () {
    const { id, bedId } = option;
    const session = yield mongoose_1.default.startSession(); // Start transaction session
    session.startTransaction();
    try {
        const result = yield admission_model_1.Admission.findByIdAndUpdate(id, {
            status: "released",
            releaseDate: new Date().toISOString(),
        }, { new: true, session });
        yield bed_model_1.Bed.findByIdAndUpdate(bedId, { isAllocated: false }, { new: true, session });
        yield session.commitTransaction();
        session.endSession();
        return result;
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
});
const transferPatientBedFromDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const previousAdmission = yield admission_model_1.Admission.findOneAndUpdate({ regNo: payload.patientRegNo }, {
            allocatedBed: payload.allocatedBed,
            isTransfer: true,
            admissionDate: new Date().toISOString(),
            admissionTime: new Date().toISOString(),
            firstAdmitDate: payload.admissionDate,
        }, { new: true, session });
        yield bed_model_1.Bed.findByIdAndUpdate(payload.previousBed, { isAllocated: false }, {
            new: true,
            session,
        });
        yield payment_model_1.Payment.findOneAndUpdate({ patientRegNo: payload.patientRegNo }, [
            {
                $set: {
                    totalAmount: payload.totalAmount,
                    dueAmount: {
                        $max: [
                            0,
                            {
                                $subtract: [
                                    payload.totalAmount,
                                    { $ifNull: ["$totalPaid", 0] },
                                ],
                            },
                        ],
                    },
                    transferAmount: payload.totalAmount,
                },
            },
        ], { new: true, session });
        yield session.commitTransaction();
        yield session.endSession();
        return previousAdmission;
    }
    catch (error) {
        yield session.abortTransaction();
        yield session.endSession();
        throw error;
    }
});
exports.AdmissionServices = {
    getAdmissionInfoFromDB,
    getAllAdmissionFromDB,
    createAdmissionIntoDB,
    realeasePatientFromDB,
    updateAdmissonIntoDB,
    transferPatientBedFromDB,
    deleteAdmissionFromDB,
};
