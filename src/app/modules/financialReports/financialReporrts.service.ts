import { PipelineStage } from "mongoose";
import { Payment } from "../payments/payment.model";
import { Admission } from "../admission/admission.model";

const getPaymentStatementGroupedByDateAndReceiver = async (
  payload: Record<string, any>
) => {
  const startDate = payload.startDate
    ? new Date(payload.startDate)
    : new Date();
  const endDate = payload.endDate ? new Date(payload.endDate) : new Date();

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const pipeline: PipelineStage[] = [
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $unwind: "$payments",
    },
    {
      $match: {
        "payments.receivedBy": { $ne: null }, // Optional: only include payments with receiver
      },
    },
    {
      $addFields: {
        paymentDate: {
          $dateToString: { format: "%Y-%m-%d", date: "$payments.createdAt" },
        },
      },
    },
    {
      $group: {
        _id: {
          date: "$paymentDate",
          receivedBy: "$payments.receivedBy",
        },
        totalAmount: { $sum: "$payments.amount" },
        totalDiscount: { $sum: { $ifNull: ["$payments.discount", 0] } },
        payments: {
          $push: {
            amount: "$payments.amount",
            discount: "$payments.discount",
            disCountBy: "$payments.disCountBy",
            receivedBy: "$payments.receivedBy",
            createdAt: "$payments.createdAt",
          },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id.receivedBy",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        date: "$_id.date",
        receivedBy: "$_id.receivedBy",
        receiverName: "$user.name",
        totalAmount: 1,
        totalDiscount: 1,
        payments: 1,
      },
    },
    {
      $sort: {
        date: -1,
      },
    },
  ];

  const result = await Payment.aggregate(pipeline);
  return result;
};

//
const getIndoorIncomeStatementFromDB = async (payload: Record<string, any>) => {
  const startDate = payload.startDate
    ? new Date(payload.startDate)
    : new Date();
  const endDate = payload.endDate ? new Date(payload.endDate) : new Date();

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const pipeline: PipelineStage[] = [
    {
      $match: {
        createdAt: {
          $gte: startDate,
          $lte: endDate,
        },
      },
    },
    {
      $unwind: "$payments",
    },

    {
      $addFields: {
        paymentDate: {
          $dateToString: { format: "%Y-%m-%d", date: "$payments.createdAt" },
        },
      },
    },

    {
      $lookup: {
        from: "admissions",
        localField: "patientRegNo",
        foreignField: "regNo",
        as: "admissionInfo",
      },
    },
    {
      $unwind: {
        path: "$admissionInfo",
        preserveNullAndEmptyArrays: true,
      },
    },

    // lookup bed info

    {
      $lookup: {
        from: "beds",
        localField: "admisionInfo.allocatedBed",
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
      $group: {
        _id: "$paymentDate",

        totalAmount: { $sum: "$payments.amount" },
        totalDiscount: { $sum: { $ifNull: ["$payments.discount", 0] } },
        payments: {
          $push: {
            amount: "$payments.amount",
            discount: "$payments.discount",
            bedName: "$bedInfo.name",
            admissionDate: "$admissionInfo.admissionDate",
            releaseDate: "$admissionInfo.releaseDate",
            createdAt: "$payments.createdAt",
          },
        },
      },
    },

    {
      $project: {
        date: "$_id",

        totalAmount: 1,
        totalDiscount: 1,
        payments: 1,
      },
    },
    {
      $sort: {
        date: -1,
      },
    },
  ];

  const result = await Payment.aggregate(pipeline);
  return result;
};

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
        paymentDate: {
          $dateToString: { format: "%Y-%m-%d", date: "$payments.createdAt" },
        },
      },
    },

    {
      $lookup: {
        from: "payments",
        localField: "patientRegNo",
        foreignField: "regNo",
        as: "paymentInfo",
      },
    },

    {
      $unwind: {
        path: "$paymentInfo",
        preserveNullAndEmptyArrays: true,
      },
    },

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
      $group: {
        _id: "$paymentDate",
        payments: {
          $push: {
            regNo: "$regNo",
            name: "$name",
            admisssionDate: "$admisssionDate",
            releaseDate: "$releaseDate",
            bedName: "$bedInfo.name",
            doctName: "$doctInfo.name",
          },
        },
      },
    },

    //
  ];

  const result = await Admission.aggregate(pipeLine);
  return result;
};

export const financialReportsServices = {
  getPaymentStatementGroupedByDateAndReceiver,
};
