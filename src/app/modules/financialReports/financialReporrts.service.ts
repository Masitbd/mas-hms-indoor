import { PipelineStage } from "mongoose";
import { Payment } from "../payments/payment.model";
import { Admission } from "../admission/admission.model";

const getIndoorIncomeStatementFromDB = async (query: Record<string, any>) => {
  const startDate = query.startDate ? new Date(query.startDate) : new Date();
  const endDate = query.endDate ? new Date(query.endDate) : new Date();

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const pipeline: PipelineStage[] = [
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
        // Take first occurrence of other fields
        bedName: { $first: "$bedInfo.bedName" },
        totalBill: { $first: "$totalAmount" },
        totalPaid: { $first: "$totalPaid" },
        admissionDate: { $first: "$patientInfo.admissionDate" },
        releaseDate: { $first: "$patientInfo.releaseDate" },
        world: { $first: "$worldInfo.fees" },
        receivedBy: { $first: "$payments.receivedBy" },
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

  const result = await Payment.aggregate(pipeline);
  return result;
};

//

const getDueStatementFromDB = async (query: Record<string, any>) => {
  const startDate = query.startDate ? new Date(query.startDate) : new Date();
  const endDate = query.endDate ? new Date(query.endDate) : new Date();

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const pipeLine: PipelineStage[] = [
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

  const result = await Admission.aggregate(pipeLine);
  return result;
};

export const financialReportsServices = {
  getIndoorIncomeStatementFromDB,
  getDueStatementFromDB,
};
