import mongoose from "mongoose";
import { Payment } from "./payment.model";
import { TPaymentArray } from "./payment.interface";

const getAllPayementInfoWithPatientInfoFromDB = async () => {
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

  const result = await Payment.aggregate(aggregatePipeline);
  return result;
};

// ? update a patient payment ==
const updatePaymentAUserIntoDB = async (
  regNo: string,
  payload: Partial<TPaymentArray>
) => {
  const result = await Payment.findOneAndUpdate(
    { patientRegNo: regNo },
    {
      $addToSet: { payments: payload },
    },
    {
      new: true,
    }
  );

  return result;
};

// export

export const PaymentServices = {
  getAllPayementInfoWithPatientInfoFromDB,
  updatePaymentAUserIntoDB,
};
