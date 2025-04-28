import mongoose from "mongoose";
import { Payment } from "./payment.model";
import { TPaymentArray } from "./payment.interface";
import { journalEntryService } from "../journal-entry/journalEntry.service";

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
  const payment = await Payment.findOne({ patientRegNo: regNo });

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

  payment.totalPaid = payment.payments.reduce(
    (acc, payment) => acc + (payment.amount - (payment.discount ?? 0)),
    0
  );

  // Recalculate dueAmount
  payment.dueAmount = Math.max(
    0,
    payment.totalAmount - (payment.totalPaid || 0)
  );

  // Save the updated document
  await payment.save();

  if (payload?.purpose == "due-collection") {
    await journalEntryService.postJournalEntryForDueCollection({
      amount: payload.amount ?? 0,
      token: "test",
    });
  }
  return payment;
};

const updatePatientDiscountInfoDB = async (
  patientRegNo: string,
  payload: any
) => {
  return await Payment.findOneAndUpdate(
    { patientRegNo: patientRegNo },
    { $inc: { discountAmount: payload.discountAmount } },
    { new: true }
  );
};

// export

export const PaymentServices = {
  getAllPayementInfoWithPatientInfoFromDB,
  updatePaymentAUserIntoDB,
  updatePatientDiscountInfoDB,
};
