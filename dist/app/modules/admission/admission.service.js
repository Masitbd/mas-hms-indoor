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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../../config");
const createAdmissionIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    console.log(payload, "payload");
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
        const { _id, createdAt, updatedAt } = payload, cleanPayload = __rest(payload, ["_id", "createdAt", "updatedAt"]);
        const result = yield admission_model_1.Admission.create([Object.assign({}, cleanPayload)], { session });
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
        // await journalEntryService.postAdmissionJournalEntry({
        //   due: netPayable - (payload?.paid ?? 0),
        //   orderAmount: netPayable,
        //   paid: payload?.paid ?? 0,
        //   token: "test",
        // });
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
            $lookup: {
                from: "packageitems",
                localField: "fixedBill",
                foreignField: "_id",
                as: "packageItemInfo",
            },
        },
        {
            $unwind: { path: "$packageItemInfo", preserveNullAndEmptyArrays: true },
        },
        {
            $addFields: {
                totalAmount: {
                    $cond: {
                        if: { $ne: ["$packageItemInfo", {}] },
                        then: "$packageItemInfo.price",
                        else: {
                            $subtract: [
                                {
                                    $add: [
                                        {
                                            $cond: {
                                                if: { $eq: ["$daysStayed", 0] },
                                                then: "$worldInfo.charge",
                                                else: {
                                                    $multiply: ["$daysStayed", "$worldInfo.fees"],
                                                },
                                            },
                                        },
                                        { $ifNull: ["$paymentInfo.serviceAmount", 0] },
                                        {
                                            $cond: {
                                                if: { $gt: ["$daysStayed", 0] },
                                                then: { $ifNull: ["$paymentInfo.totalAmount", 0] },
                                                else: 0,
                                            },
                                        },
                                    ],
                                },
                                { $ifNull: ["$paymentInfo.discountAmount", 0] },
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
        {
            $unwind: { path: "$services", preserveNullAndEmptyArrays: true },
        },
        {
            $set: {
                serviceObjectId: {
                    $cond: {
                        if: { $eq: [{ $type: "$services.serviceId" }, "string"] },
                        then: { $toObjectId: "$services.serviceId" },
                        else: "$services.serviceId", // if already ObjectId, keep as it is
                    },
                },
            },
        },
        {
            $lookup: {
                from: "tests",
                localField: "serviceObjectId",
                foreignField: "_id",
                as: "serviceInfo",
            },
        },
        { $unwind: { path: "$serviceInfo", preserveNullAndEmptyArrays: true } },
        {
            $addFields: {
                "services.label": "$serviceInfo.label",
            },
        },
        {
            $group: {
                _id: "$_id",
                allocatedBed: { $first: "$allocatedBed" },
                paymentId: { $first: "$paymentId" },
                allocatedBedDetails: { $first: "$allocatedBedDetails" },
                totalAmount: { $first: "$totalAmount" },
                daysStayed: { $first: "$daysStayed" },
                paymentInfo: { $first: "$paymentInfo" },
                admissionDate: { $first: "$admissionDate" },
                admissionTime: { $first: "$admissionTime" },
                regNo: { $first: "$regNo" },
                age: { $first: "$age" },
                patientType: { $first: "$patientType" },
                uuid: { $first: "$uuid" },
                gender: { $first: "$gender" },
                address: { $first: "$presentAddress" },
                assignDoct: { $first: "$assignDoct" },
                refDoct: { $first: "$refDoct" },
                name: { $first: "$name" },
                status: { $first: "$status" },
                isTransfer: { $first: "$isTransfer" },
                transferInfo: { $first: "$transferInfo" },
                services: {
                    $push: {
                        $cond: {
                            if: { $ifNull: ["$services", false] },
                            then: {
                                _id: "$services._id",
                                serviceId: "$services.serviceId",
                                quantity: "$services.quantity",
                                rate: "$services.rate",
                                total: "$services.amount",
                                label: "$services.label",
                            },
                            else: "$$REMOVE",
                        },
                    },
                },
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
    const { id, bedId, authorPerson } = option;
    const session = yield mongoose_1.default.startSession(); // Start transaction session
    session.startTransaction();
    try {
        const result = yield admission_model_1.Admission.findByIdAndUpdate(id, {
            status: "released",
            releaseDate: new Date().toISOString(),
            authorPerson,
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
const addServicesToPatientIntoDB = (payload, token) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
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
        // Update bed allocation
        if (payload.allocatedBed) {
            yield bed_model_1.Bed.findByIdAndUpdate(payload.allocatedBed, { isAllocated: true }, { new: true, session });
        }
        // Update Payment
        yield payment_model_1.Payment.findOneAndUpdate({ patientRegNo: payload.regNo }, { $inc: { serviceAmount: payload.totalBill } }, { new: true, session });
        const updateData = {
            $push: { services: { $each: servicesToAdd } },
        };
        if (payload.allocatedBed) {
            updateData.$set = {
                allocatedBed: payload.allocatedBed,
            };
        }
        // ! added call order id here
        const investigationServices = services === null || services === void 0 ? void 0 : services.filter((s) => s.serviceCategory === "investigation");
        if (investigationServices && investigationServices.length > 0) {
            const tests = investigationServices.map((s, index) => ({
                SL: index + 1,
                test: s.serviceId,
                status: "pending",
                discount: s.discount || 0,
                deliveryTime: null,
                remark: "",
            }));
            const totalPrice = investigationServices.reduce((sum, s) => sum + (s.amount || 0), 0);
            const orderPayload = {
                tests,
                totalPrice,
                cashDiscount: 0,
                parcentDiscount: 0,
                deliveryTime: new Date(),
                status: "pending",
                dueAmount: 0,
                paid: 0,
                vat: 0,
                refBy: payload.refDoct,
                consultant: payload.consultant,
                uuid: payload.uuid,
                remarks: payload.regNo,
                patientType: payload.patientType,
                discountedBy: "system",
                postedBy: payload.servicedBy,
                tubePrice: 0,
                patient: payload.patient,
            };
            console.log(investigationServices, "int");
            yield axios_1.default.post(`${config_1.config.backend_url}/order`, orderPayload, {
                headers: {
                    Authorization: token,
                },
                withCredentials: true,
            });
        }
        // ? end
        // Update Admission
        const updated = yield admission_model_1.Admission.updateOne({ regNo }, updateData, {
            session,
        });
        yield session.commitTransaction();
        session.endSession();
        // await journalEntryService.postJournalEntryForServiceAdd({
        //   amount: payload.totalBill ?? 0,
        //   token: "test",
        // });
        return updated;
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
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
