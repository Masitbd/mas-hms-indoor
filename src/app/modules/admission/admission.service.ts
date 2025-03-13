import mongoose from "mongoose";
import { generateRegId } from "../../utils/generateRegId";
import { Bed } from "../beds/bed.model";
import { Payment } from "../payments/payment.model";
import { TPAdmission } from "./admission.interface";
import { Admission } from "./admission.model";

const createAdmissionIntoDB = async (payload: any) => {
  const session = await mongoose.startSession(); // Start transaction session
  session.startTransaction();

  try {
    const regNo = await generateRegId();

    payload.patientRegNo = regNo;

    // Ensure isTransfer is a boolean
    if (payload.isTransfer === "") {
      payload.isTransfer = false;
    }

    // Create payment document inside the transaction
    const createPayment = await Payment.create([{ ...payload }], { session });

    // Attach regNo and paymentId
    payload.regNo = regNo;
    payload.paymentId = createPayment[0]._id;

    // Create admission document inside the transaction
    const result = await Admission.create([{ ...payload }], { session });

    // Commit the transaction
    await session.commitTransaction();
    session.endSession();

    return result[0];
  } catch (error) {
    // Rollback transaction on failure
    await session.abortTransaction();
    session.endSession();
    throw error; // Ensure the error is propagated
  }
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
