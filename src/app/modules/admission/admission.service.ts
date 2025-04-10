import { admissonSearchableFields } from "./admission.constance";
import mongoose from "mongoose";
import { generateRegId } from "../../utils/generateRegId";
import { Bed } from "../beds/bed.model";
import { Payment } from "../payments/payment.model";
import { TPAdmission } from "./admission.interface";
import { Admission } from "./admission.model";

import QueryBuilder from "../../builder/QueryBuilder";
import { TransferBed } from "../bedTransfer/bedTansfer.model";

type TTransfer = {
  previousBed: string;
  allocatedBed: string;
  isTransfer: boolean;
  admissionDate: string;
  admissionTime: string;
  firstAdmitDate: string;
  totalAmount: number;
  patientRegNo: string;
  id: string;
  dayStayed: number;
};

const createAdmissionIntoDB = async (payload: any) => {
  const session = await mongoose.startSession(); // Start transaction session
  session.startTransaction();

  try {
    const regNo = await generateRegId();

    payload.patientRegNo = regNo;

    if (payload.isTransfer === "") {
      payload.isTransfer = false;
    }

    const createPayment = await Payment.create([{ ...payload }], { session });

    payload.regNo = regNo;
    payload.paymentId = createPayment[0]._id;

    const result = await Admission.create([{ ...payload }], { session });

    await Bed.findByIdAndUpdate(
      payload.allocatedBed,
      { isAllocated: true },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();

    return result[0];
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error; // Ensure the error is propagated
  }
};

// ? get all admission

const getAllAdmissionFromDB = async (query: Record<string, any>) => {
  const admissionQuery = new QueryBuilder(
    Admission.find()
      .select("regNo name admissionDate admissionTime allocatedBed status")
      .populate("allocatedBed", "bedName"),
    query
  )
    .search(admissonSearchableFields)
    .filter()
    .sort()
    .paginate();

  const meta = await admissionQuery.countTotal();
  const result = await admissionQuery.modelQuery;
  return {
    meta,
    result,
  };
};

// ? get single

const getAdmissionInfoFromDB = async (id: string) => {
  const aggregatePipeline = [
    {
      $match: { _id: new mongoose.Types.ObjectId(id) },
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

  const result = await Admission.aggregate(aggregatePipeline);
  return result;
};

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
//
const realeasePatientFromDB = async (option: { id: string; bedId: string }) => {
  const { id, bedId } = option;
  const session = await mongoose.startSession(); // Start transaction session
  session.startTransaction();

  try {
    const result = await Admission.findByIdAndUpdate(
      id,
      {
        status: "released",
        releaseDate: new Date().toISOString(),
      },
      { new: true, session }
    );

    await Bed.findByIdAndUpdate(
      bedId,
      { isAllocated: false },
      { new: true, session }
    );

    await session.commitTransaction();
    session.endSession();
    return result;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};
//

const transferPatientBedFromDB = async (payload: TTransfer) => {
  const {
    previousBed,
    allocatedBed,
    admissionDate,
    dayStayed,
    id,
    totalAmount,
  } = payload;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const previousAdmission = await Admission.findOneAndUpdate(
      { regNo: payload.patientRegNo },
      {
        allocatedBed: payload.allocatedBed,
        isTransfer: true,
        admissionDate: new Date().toISOString(),
        admissionTime: new Date().toISOString(),
        firstAdmitDate: payload.admissionDate,
      },
      { new: true, session }
    );

    await Bed.findByIdAndUpdate(
      payload.previousBed,
      { isAllocated: false },
      {
        new: true,
        session,
      }
    );

    await Payment.findOneAndUpdate(
      { patientRegNo: payload.patientRegNo },
      [
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
      ],
      { new: true, session }
    );

    // transfer info add

    const transferBedInfo = {
      patientId: id,
      previousBed,
      newBed: allocatedBed,
      admissionDate,
      totalAmount,
      dayStayed,
    };

    await TransferBed.create([transferBedInfo], { session });

    await session.commitTransaction();
    await session.endSession();
    return previousAdmission;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

export const AdmissionServices = {
  getAdmissionInfoFromDB,
  getAllAdmissionFromDB,
  createAdmissionIntoDB,
  realeasePatientFromDB,
  updateAdmissonIntoDB,
  transferPatientBedFromDB,
  deleteAdmissionFromDB,
};
