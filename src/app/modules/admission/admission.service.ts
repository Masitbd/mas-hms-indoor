import mongoose from "mongoose";
import { generateRegId } from "../../utils/generateRegId";
import { Bed } from "../beds/bed.model";
import { Payment } from "../payments/payment.model";
import { TPAdmission } from "./admission.interface";
import { Admission } from "./admission.model";

const createAdmissionIntoDB = async (paylaod: any) => {
  const regNo = await generateRegId();

  const { paymentInfo } = paylaod;

  paymentInfo.patientRegNo = regNo;

  const createPayment = await Payment.create(paymentInfo);

  paylaod.regNo = regNo;
  paylaod.paymentId = createPayment._id;

  const reuslt = await Admission.create(paylaod);
  return reuslt;
};

// ? get single

const getAdmissionInfoFromDB = async (id: string) => {
  const aggregatePipeline = [
    {
      $match: { _id: new mongoose.Types.ObjectId(id) },
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

  const result = await Admission.aggregate(aggregatePipeline);
};

// update admission

const updateAdmissonIntoDB = async (
  id: string,
  payload: Partial<TPAdmission>
) => {
  const result = await Admission.findByIdAndUpdate(id, payload, { new: true });

  return result;
};

const deleteAdmissionFromDB = async (id: string) => {
  const result = await Admission.findByIdAndDelete(id);

  if (result) {
    await Payment.findOneAndDelete({ patientRegNo: result.regNo });
    await Bed.findOneAndUpdate(
      {
        "beds._id": result.allocatedBed,
      },
      {
        isAllocated: false,
      },
      {
        new: true,
      }
    );
  }
};

export const AdmissionServices = {
  getAdmissionInfoFromDB,
  createAdmissionIntoDB,
  updateAdmissonIntoDB,
  deleteAdmissionFromDB,
};
