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
exports.financialReportsServices = void 0;
const payment_model_1 = require("../payments/payment.model");
const admission_model_1 = require("../admission/admission.model");
const getIndoorIncomeStatementFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const startDate = query.startDate ? new Date(query.startDate) : new Date();
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    const pipeline = [
        // 1. Unwind payments to process individually
        { $unwind: "$payments" },
        // 2. Filter by date range
        {
            $match: {
                "payments.createdAt": {
                    $gte: startDate,
                    $lte: endDate,
                },
            },
        },
        // 3. Add formatted payment date
        {
            $addFields: {
                paymentDate: {
                    $dateToString: { format: "%Y-%m-%d", date: "$payments.createdAt" },
                },
                paymentAmount: "$payments.amount",
                paymentDiscount: "$payments.discount",
                patientRegNo: "$patientRegNo", // Explicitly use patientRegNo
            },
        },
        // 4. Lookup admission data
        {
            $lookup: {
                from: "admissions",
                localField: "patientRegNo",
                foreignField: "regNo",
                as: "patientInfo",
            },
        },
        { $unwind: { path: "$patientInfo", preserveNullAndEmptyArrays: true } },
        // 5. Lookup bed data
        {
            $lookup: {
                from: "beds",
                localField: "patientInfo.allocatedBed",
                foreignField: "_id",
                as: "bedInfo",
            },
        },
        { $unwind: { path: "$bedInfo", preserveNullAndEmptyArrays: true } },
        // 6. Lookup world data
        {
            $lookup: {
                from: "bedworlds",
                localField: "bedInfo.worldId",
                foreignField: "_id",
                as: "worldInfo",
            },
        },
        { $unwind: { path: "$worldInfo", preserveNullAndEmptyArrays: true } },
        // 7. Group by paymentDate + patientRegNo (MERGE PAYMENTS)
        {
            $group: {
                _id: {
                    paymentDate: "$paymentDate",
                    patientRegNo: "$patientRegNo",
                },
                // Sum amounts and discounts
                amount: { $sum: "$paymentAmount" },
                discount: { $sum: "$paymentDiscount" },
                bedName: { $first: "$bedInfo.bedName" },
                // totalBill: { $first: "$totalAmount" },
                totalPaid: { $first: "$totalPaid" },
                admissionDate: { $first: "$patientInfo.admissionDate" },
                releaseDate: { $first: "$patientInfo.releaseDate" },
            },
        },
        // 8. Group by paymentDate only (for daily totals)
        {
            $group: {
                _id: "$_id.paymentDate",
                records: {
                    $push: {
                        regNo: "$_id.patientRegNo",
                        amount: "$amount", // Summed amount for this patient
                        discount: "$discount",
                        bedName: "$bedName",
                        totalBill: "$totalBill",
                        totalPaid: "$totalPaid",
                        admissionDate: "$admissionDate",
                        releaseDate: "$releaseDate",
                        world: "$world",
                        receivedBy: "$receivedBy",
                    },
                },
                totalAmountPaid: { $sum: "$amount" }, // Sum all patients' payments
                totalDiscount: { $sum: "$discount" },
                totalBill: { $first: "$totalBill" },
                totalPaid: { $first: "$totalPaid" },
            },
        },
        // 9. Calculate due amount
        {
            $addFields: {
                dueAmount: { $subtract: ["$totalBill", "$totalAmountPaid"] },
            },
        },
        // 12. Final projection
        {
            $project: {
                paymentDate: "$_id",
                records: 1,
                totalAmountPaid: 1,
                totalDiscount: 1,
                totalBill: 1,
                totalPaid: 1,
                dueAmount: 1,
                _id: 0,
            },
        },
        // 13. Sort by date (newest first)
        { $sort: { paymentDate: -1 } },
    ];
    const result = yield payment_model_1.Payment.aggregate(pipeline);
    return result;
});
//
const getDailyCollectionFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const startDate = query.startDate ? new Date(query.startDate) : new Date();
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    const pipeline = [
        { $unwind: "$payments" },
        {
            $match: {
                "payments.createdAt": {
                    $gte: startDate,
                    $lte: endDate,
                },
            },
        },
        {
            $addFields: {
                paymentDate: {
                    $dateToString: { format: "%Y-%m-%d", date: "$payments.createdAt" },
                },
                paymentAmount: "$payments.amount",
                paymentDiscount: "$payments.discount",
                patientRegNo: "$patientRegNo",
            },
        },
        {
            $lookup: {
                from: "profiles",
                localField: "payments.receivedBy",
                foreignField: "uuid",
                as: "userInfo",
            },
        },
        { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
        // Group by paymentDate + receiver + patientRegNo
        {
            $group: {
                _id: {
                    paymentDate: "$paymentDate",
                    receiver: "$payments.receivedBy",
                    patientRegNo: "$patientRegNo",
                    name: "$userInfo.name",
                },
                amount: { $sum: "$paymentAmount" },
                discount: { $sum: "$paymentDiscount" },
                createdAt: { $first: "$payments.createdAt" },
            },
        },
        // Group by paymentDate + receiver
        {
            $group: {
                _id: {
                    paymentDate: "$_id.paymentDate",
                    receiver: "$_id.receiver",
                    name: "$_id.name",
                },
                patients: {
                    $push: {
                        name: "$_id.name",
                        regNo: "$_id.patientRegNo",
                        amount: "$amount",
                        discount: "$discount",
                        createdAt: "$createdAt",
                    },
                },
                totalAmountPaid: { $sum: "$amount" },
                // totalDiscount: { $sum: "$discount" },
            },
        },
        // Group by paymentDate (final structure: date -> receiver -> patients[])
        {
            $group: {
                _id: "$_id.paymentDate",
                receivers: {
                    $push: {
                        receiver: "$_id.name",
                        totalAmountPaid: "$totalAmountPaid",
                        totalDiscount: "$totalDiscount",
                        records: "$patients",
                    },
                },
                dailyTotalAmountPaid: { $sum: "$totalAmountPaid" },
                dailyTotalDiscount: { $sum: "$totalDiscount" },
            },
        },
        {
            $project: {
                paymentDate: "$_id",
                receivers: 1,
                dailyTotalAmountPaid: 1,
                dailyTotalDiscount: 1,
                _id: 0,
            },
        },
        { $sort: { paymentDate: -1 } },
    ];
    const result = yield payment_model_1.Payment.aggregate(pipeline);
    return result;
});
// Indoor Due Collection Statement
const getDueCollectionStatementFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const startDate = query.startDate ? new Date(query.startDate) : new Date();
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    const pipeline = [
        // 1. Unwind payments to process individually
        { $unwind: "$payments" },
        // 2. Filter by date range
        {
            $match: {
                "payments.createdAt": {
                    $gte: startDate,
                    $lte: endDate,
                },
                "payments.purpose": "due-collection",
            },
        },
        // 3. Add formatted payment date
        {
            $addFields: {
                paymentDate: {
                    $dateToString: { format: "%Y-%m-%d", date: "$payments.createdAt" },
                },
                paymentAmount: "$payments.amount",
                paymentDiscount: "$payments.discount",
                patientRegNo: "$patientRegNo", // Explicitly use patientRegNo
            },
        },
        // 4. Lookup admission data
        {
            $lookup: {
                from: "admissions",
                localField: "patientRegNo",
                foreignField: "regNo",
                as: "patientInfo",
            },
        },
        { $unwind: { path: "$patientInfo", preserveNullAndEmptyArrays: true } },
        // 5. Lookup bed data
        {
            $lookup: {
                from: "beds",
                localField: "patientInfo.allocatedBed",
                foreignField: "_id",
                as: "bedInfo",
            },
        },
        { $unwind: { path: "$bedInfo", preserveNullAndEmptyArrays: true } },
        // 6. Lookup world data
        {
            $lookup: {
                from: "bedworlds",
                localField: "bedInfo.worldId",
                foreignField: "_id",
                as: "worldInfo",
            },
        },
        { $unwind: { path: "$worldInfo", preserveNullAndEmptyArrays: true } },
        // 7. Group by paymentDate + patientRegNo (MERGE PAYMENTS)
        {
            $group: {
                _id: {
                    paymentDate: "$paymentDate",
                    patientRegNo: "$patientRegNo",
                },
                // Sum amounts and discounts
                amount: { $sum: "$paymentAmount" },
                discount: { $sum: "$paymentDiscount" },
                // Take first occurrence of other fields
                bedName: { $first: "$bedInfo.bedName" },
                totalBill: { $first: "$totalAmount" },
                totalPaid: { $first: "$totalPaid" },
                admissionDate: { $first: "$patientInfo.admissionDate" },
                name: { $first: "$patientInfo.name" },
                releaseDate: { $first: "$patientInfo.releaseDate" },
            },
        },
        // 8. Group by paymentDate only (for daily totals)
        {
            $group: {
                _id: "$_id.paymentDate",
                records: {
                    $push: {
                        regNo: "$_id.patientRegNo",
                        name: "$name",
                        amount: "$amount", // Summed amount for this patient
                        discount: "$discount",
                        bedName: "$bedName",
                        totalPaid: { $sum: "$amount" },
                        admissionDate: "$admissionDate",
                        releaseDate: "$releaseDate",
                    },
                },
                totalAmountPaid: { $sum: "$amount" }, // Sum all patients' payments
                totalDiscount: { $sum: "$discount" },
                totalPaid: { $sum: "$totalPaid" },
            },
        },
        // 9. Calculate due amount
        // {
        //   $addFields: {
        //     dueAmount: { $subtract: ["$totalBill", "$totalAmountPaid"] },
        //   },
        // },
        // 12. Final projection
        {
            $project: {
                paymentDate: "$_id",
                records: 1,
                totalAmountPaid: 1,
                totalDiscount: 1,
                totalBill: 1,
                totalPaid: 1,
                // dueAmount: 1,
                _id: 0,
            },
        },
        // 13. Sort by date (newest first)
        { $sort: { paymentDate: -1 } },
    ];
    const result = yield payment_model_1.Payment.aggregate(pipeline);
    return result;
});
//
const getDueStatementFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const startDate = query.startDate ? new Date(query.startDate) : new Date();
    const endDate = query.endDate ? new Date(query.endDate) : new Date();
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    const pipeLine = [
        {
            $match: {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
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
        // Lookup related collections
        {
            $lookup: {
                from: "beds",
                localField: "allocatedBed",
                foreignField: "_id",
                as: "bedInfo",
            },
        },
        {
            $unwind: {
                path: "$bedInfo",
                preserveNullAndEmptyArrays: true,
            },
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
            $unwind: {
                path: "$doctInfo",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup: {
                from: "bedworlds",
                localField: "bedInfo.worldId",
                foreignField: "_id",
                as: "worldInfo",
            },
        },
        {
            $unwind: {
                path: "$worldInfo",
                preserveNullAndEmptyArrays: true,
            },
        },
        // Lookup payment information using the payment document directly
        {
            $lookup: {
                from: "payments",
                let: { patientRegNo: "$regNo" },
                pipeline: [
                    {
                        $match: { $expr: { $eq: ["$patientRegNo", "$$patientRegNo"] } },
                    },
                ],
                as: "paymentDoc",
            },
        },
        {
            $unwind: {
                path: "$paymentDoc",
                preserveNullAndEmptyArrays: true,
            },
        },
        // Use the totalPaid field directly from the payment document
        {
            $addFields: {
                totalPaid: { $ifNull: ["$paymentDoc.totalPaid", 0] },
            },
        },
        // Calculate total amount based on days stayed
        {
            $addFields: {
                totalAmount: {
                    $cond: {
                        if: { $eq: ["$daysStayed", 0] },
                        then: "$worldInfo.charge",
                        else: {
                            $add: [
                                { $multiply: ["$daysStayed", "$worldInfo.fees"] },
                                "$worldInfo.charge",
                            ],
                        },
                    },
                },
            },
        },
        // Calculate due amount
        {
            $addFields: {
                dueAmount: { $subtract: ["$totalAmount", "$totalPaid"] },
            },
        },
        // Filter only due cases
        {
            $match: {
                dueAmount: { $gt: 0 },
            },
        },
        // Group by payment date
        {
            $group: {
                _id: "$paymentDate",
                payments: {
                    $push: {
                        regNo: "$regNo",
                        name: "$name",
                        admisssionDate: "$admissionDate",
                        releaseDate: { $ifNull: ["$releaseDate", ""] },
                        bedName: "$bedInfo.bedName",
                        doctName: "$doctInfo.name",
                        totalPaid: "$totalPaid",
                        totalAmount: "$totalAmount",
                        dueAmount: "$dueAmount",
                    },
                },
                totalBillSum: { $sum: "$totalAmount" },
                totalPaidSum: { $sum: "$totalPaid" },
                dueAmountSum: { $sum: "$dueAmount" },
            },
        },
        // Sort by date if needed
        { $sort: { _id: -1 } },
    ];
    const result = yield admission_model_1.Admission.aggregate(pipeLine);
    return result;
});
exports.financialReportsServices = {
    getIndoorIncomeStatementFromDB,
    getDueStatementFromDB,
    getDailyCollectionFromDB,
    getDueCollectionStatementFromDB,
};
