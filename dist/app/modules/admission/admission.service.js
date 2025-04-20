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
const bedTansfer_model_1 = require("../bedTransfer/bedTansfer.model");
const ApiError_1 = __importDefault(require("../../../errors/ApiError"));
const journalEntry_service_1 = require("../journal-entry/journalEntry.service");
const createAdmissionIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const session = yield mongoose_1.default.startSession(); // Start transaction session
    session.startTransaction();
    try {
        const regNo = yield (0, generateRegId_1.generateRegId)();
        payload.patientRegNo = regNo;
        if (payload.isTransfer === "") {
            payload.isTransfer = false;
        }
        const paymentPayload = {
            patientRegNo: regNo,
            totalAmount: payload.totalAmount || 0,
            payments: [
                {
                    amount: payload.paid || 0,
                    discount: payload.discount || 0,
                    disCountBy: payload.disCountBy || "",
                    receivedBy: payload.receivedBy,
                },
            ],
        };
        paymentPayload.totalPaid =
            (paymentPayload.payments[0].amount || 0) -
                (paymentPayload.payments[0].discount || 0);
        paymentPayload.dueAmount = Math.max(0, paymentPayload.totalAmount - paymentPayload.totalPaid);
        const createPayment = yield payment_model_1.Payment.create([paymentPayload], { session });
        payload.regNo = regNo;
        payload.paymentId = createPayment[0]._id;
        const result = yield admission_model_1.Admission.create([Object.assign({}, payload)], { session });
        yield bed_model_1.Bed.findByIdAndUpdate(payload.allocatedBed, { isAllocated: true }, { new: true, session });
        yield session.commitTransaction();
        session.endSession();
        // calculation of net price
        const netPrice = payload.totalAmount -
            ((_a = payload === null || payload === void 0 ? void 0 : payload.cashDiscount) !== null && _a !== void 0 ? _a : 0) -
            (payload.totalAmount * ((_b = payload.parcentDiscount) !== null && _b !== void 0 ? _b : 0)) / 100;
        const vat = ((netPrice !== null && netPrice !== void 0 ? netPrice : 0) * ((_c = payload === null || payload === void 0 ? void 0 : payload.vat) !== null && _c !== void 0 ? _c : 0)) / 100;
        const netPayable = netPrice + vat;
        //! token should be passed in future
        yield journalEntry_service_1.journalEntryService.postAdmissionJournalEntry({
            due: netPayable - ((_d = payload === null || payload === void 0 ? void 0 : payload.paid) !== null && _d !== void 0 ? _d : 0),
            orderAmount: netPayable,
            paid: (_e = payload === null || payload === void 0 ? void 0 : payload.paid) !== null && _e !== void 0 ? _e : 0,
            token: "test",
        });
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
    const admissionQuery = new QueryBuilder_1.default(admission_model_1.Admission.find({ status: "admitted" })
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
        {
            $addFields: {
                admissionDateConverted: { $toDate: "$admissionDate" },
                admissionTimeConverted: { $toDate: "$admissionTime" },
                releaseDateConverted: {
                    $cond: {
                        if: {
                            $and: [
                                { $ne: ["$releaseDate", null] },
                                { $ne: ["$releaseDate", ""] },
                            ],
                        },
                        then: { $toDate: "$releaseDate" },
                        else: null,
                    },
                },
                billingEndDate: {
                    $cond: {
                        if: {
                            $and: [
                                { $ne: ["$releaseDate", null] },
                                { $ne: ["$releaseDate", ""] },
                            ],
                        },
                        then: { $toDate: "$releaseDate" },
                        else: "$$NOW",
                    },
                },
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
                                endDate: "$billingEndDate",
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
        {
            $lookup: {
                from: "transferbeds",
                localField: "tranferInfo",
                foreignField: "_id",
                as: "transferInfo",
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
                transferInfo: 1,
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
//
const transferPatientBedFromDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { previousBed, allocatedBed, admissionDate, dayStayed, id, totalAmount, } = payload;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const transferInfo = yield bedTansfer_model_1.TransferBed.findOneAndUpdate({ patientId: id }, {
            $push: {
                transferInfo: {
                    previousBed,
                    newBed: allocatedBed,
                    admissionDate,
                    totalAmount,
                    dayStayed,
                },
            },
        }, { upsert: true, new: true, session });
        const previousAdmission = yield admission_model_1.Admission.findOneAndUpdate({ regNo: payload.patientRegNo }, {
            allocatedBed: payload.allocatedBed,
            isTransfer: true,
            admissionDate: new Date().toISOString(),
            admissionTime: new Date().toISOString(),
            firstAdmitDate: payload.admissionDate,
            tranferInfo: transferInfo === null || transferInfo === void 0 ? void 0 : transferInfo._id,
        }, { new: true, session });
        yield bed_model_1.Bed.findByIdAndUpdate(payload.previousBed, { isAllocated: false }, {
            new: true,
            session,
        });
        yield payment_model_1.Payment.findOneAndUpdate({ patientRegNo: payload.patientRegNo }, [
            {
                $set: {
                    totalAmount: {
                        $add: ["$totalAmount", payload.totalAmount],
                    },
                    dueAmount: {
                        $max: [
                            0,
                            {
                                $subtract: [
                                    { $add: ["$totalAmount", payload.totalAmount] }, // updated totalAmount
                                    { $ifNull: ["$totalPaid", 0] },
                                ],
                            },
                        ],
                    },
                    transferAmount: {
                        $add: ["$transferAmount", payload.totalAmount],
                    },
                },
            },
        ], { new: true, session });
        // transfer info add
        yield session.commitTransaction();
        yield session.endSession();
        //Posting the amount to the account server
        yield journalEntry_service_1.journalEntryService.postJournalEntryForBedTransfer({
            amount: (_a = payload === null || payload === void 0 ? void 0 : payload.totalAmount) !== null && _a !== void 0 ? _a : 0,
            token: "test",
        });
        return previousAdmission;
    }
    catch (error) {
        yield session.abortTransaction();
        yield session.endSession();
        throw error;
    }
});
// today's admitted patient
const getTodayAdmittedPatientFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    const now = new Date();
    const todayString = now.toISOString().split("T")[0];
    const aggregatePipeline = [
        {
            $match: {
                status: "admitted",
            },
        },
        {
            $addFields: {
                admissionDateObj: {
                    $cond: {
                        if: { $eq: [{ $type: "$admissionDate" }, "string"] },
                        then: { $dateFromString: { dateString: "$admissionDate" } },
                        else: "$admissionDate",
                    },
                },
            },
        },
        // Extract date string for comparison
        {
            $addFields: {
                admissionDateString: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$admissionDateObj",
                    },
                },
            },
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
        {
            $lookup: {
                from: "doctors",
                localField: "assignDoct",
                foreignField: "_id",
                as: "doctInfo",
            },
        },
        {
            $unwind: { path: "$doctInfo", preserveNullAndEmptyArrays: true },
        },
        // Compare with today's date string
        {
            $addFields: {
                group: {
                    $cond: {
                        if: { $eq: ["$admissionDateString", todayString] },
                        then: "Today",
                        else: "Before Today",
                    },
                },
            },
        },
        // Project only necessary fields
        {
            $project: {
                name: 1,
                regNo: 1,
                admissionDate: 1,
                fatherName: 1,
                releaseDate: 1,
                bedName: "$bedInfo.bedName",
                doctName: "$doctInfo.name",
                createdAt: 1,
                group: 1,
                status: 1,
            },
        },
        // Final group
        {
            $group: {
                _id: "$group",
                count: { $sum: 1 },
                patients: { $push: "$$ROOT" },
            },
        },
    ];
    const result = yield admission_model_1.Admission.aggregate(aggregatePipeline);
    return result;
});
// get patient over a period
const getAdmittedPatientOverAPeriodFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const startDate = query.startDate ? new Date(query.startDate) : new Date();
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    const aggregatePipeline = [
        // Step 1: Combine date + time into admissionDateTime
        {
            $addFields: {
                admissionDateParsed: { $toDate: "$admissionDate" },
                admissionTimeParsed: { $toDate: "$admissionTime" },
            },
        },
        {
            $addFields: {
                admissionDateTime: {
                    $dateFromParts: {
                        year: { $year: "$admissionDateParsed" },
                        month: { $month: "$admissionDateParsed" },
                        day: { $dayOfMonth: "$admissionDateParsed" },
                        hour: { $hour: "$admissionTimeParsed" },
                        minute: { $minute: "$admissionTimeParsed" },
                        second: { $second: "$admissionTimeParsed" },
                    },
                },
            },
        },
        {
            $match: {
                admissionDateTime: {
                    $gte: startDate,
                    $lte: endDate,
                },
            },
        },
        // Step 3: Lookup bed info
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
        // Step 4: Group by date (ignoring time)
        {
            $group: {
                _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$admissionDateTime" },
                },
                patients: {
                    $push: {
                        name: "$name",
                        regNo: "$regNo",
                        admissionDate: "$admissionDateTime",
                        bedName: "$bedInfo.bedName",
                        releaseDate: "$releaseDate",
                        presentAddress: "$presentAddress",
                    },
                },
                count: { $sum: 1 },
            },
        },
        // Optional: Sort by date ascending
        {
            $sort: {
                _id: 1,
            },
        },
    ];
    const result = yield admission_model_1.Admission.aggregate(aggregatePipeline);
    return result;
});
// add service
const addServicesToPatientIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { regNo, services = [] } = payload;
    if (!regNo || !services) {
        throw new ApiError_1.default(400, "Need RegNo and Service");
    }
    const incomingServiceIds = services.map((s) => s.serviceId);
    const existing = yield admission_model_1.Admission.findOne({
        regNo,
        "services.serviceId": { $in: incomingServiceIds },
    }, { "services.serviceId": 1 }).lean();
    const existingIdsSet = new Set(((existing === null || existing === void 0 ? void 0 : existing.services) || []).map((s) => s.serviceId.toString()));
    const newServices = services.filter((s) => !existingIdsSet.has(s.serviceId.toString()));
    if (newServices.length === 0) {
        throw new ApiError_1.default(400, "Already Exist");
    }
    const servicesToAdd = newServices.map((s) => (Object.assign({}, s)));
    yield bed_model_1.Bed.findByIdAndUpdate(payload.allocatedBed, { isAllocated: true }, { new: true });
    yield payment_model_1.Payment.findOneAndUpdate({ patientRegNo: payload.regNo }, // or any other condition
    { $inc: { serviceAmount: payload.totalBill } }, { new: true });
    const updateData = {
        $push: { services: { $each: servicesToAdd } },
    };
    // Only add allocatedBed if it exists in payload
    if (payload.allocatedBed) {
        updateData.$set = {
            allocatedBed: payload.allocatedBed,
        };
    }
    // Step 5: Push new services
    const updated = yield admission_model_1.Admission.updateOne({ regNo }, updateData);
    // Post journal service
    yield journalEntry_service_1.journalEntryService.postJournalEntryForServiceAdd({
        amount: (_a = payload.totalBill) !== null && _a !== void 0 ? _a : 0,
        token: "test",
    });
    return updated;
});
exports.AdmissionServices = {
    getAdmissionInfoFromDB,
    getAllAdmissionFromDB,
    getTodayAdmittedPatientFromDB,
    createAdmissionIntoDB,
    realeasePatientFromDB,
    updateAdmissonIntoDB,
    addServicesToPatientIntoDB,
    transferPatientBedFromDB,
    deleteAdmissionFromDB,
    getAdmittedPatientOverAPeriodFromDB,
};
