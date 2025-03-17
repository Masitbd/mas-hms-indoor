import { admissonSearchableFields } from "./admission.constance";
import mongoose from "mongoose";
import { generateRegId } from "../../utils/generateRegId";
import { Bed } from "../beds/bed.model";
import { Payment } from "../payments/payment.model";
import { TPAdmission } from "./admission.interface";
import { Admission } from "./admission.model";
import { query } from "express";
import QueryBuilder from "../../builder/QueryBuilder";

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
                  $gte: [{ $hour: "$admissionTimeConverted" }, 12], // Check if admissionTime is >= 12 PM
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
          $add: [
            { $multiply: ["$daysStayed", "$worldInfo.fees"] },
            { $ifNull: ["$paymentInfo.totalAmount", 0] },
          ],
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
      },
    },
  ];

  const result = await Admission.aggregate(aggregatePipeline);
  return result;
};

// const getAdmissionInfoFromDB = async (id: string) => {
//   const aggregatePipeline = [
//     {
//       $match: { _id: new mongoose.Types.ObjectId(id) },
//     },

//     // Lookup bed information
//     {
//       $lookup: {
//         from: "beds",
//         localField: "allocatedBed",
//         foreignField: "_id",
//         as: "bedInfo",
//       },
//     },

//     {
//       $unwind: { path: "$bedInfo", preserveNullAndEmptyArrays: true },
//     },

//     // Lookup world information from worldId in bedInfo
//     {
//       $lookup: {
//         from: "bedworlds",
//         localField: "bedInfo.worldId",
//         foreignField: "_id",
//         as: "worldInfo",
//       },
//     },

//     {
//       $unwind: { path: "$worldInfo", preserveNullAndEmptyArrays: true },
//     },

//     // Add allocated bed details
//     {
//       $addFields: {
//         allocatedBedDetails: {
//           _id: "$bedInfo._id",
//           bedName: "$bedInfo.bedName",
//           isAllocated: "$bedInfo.isAllocated",
//           phone: "$bedInfo.phone",
//           floor: "$bedInfo.floor",

//           world: {
//             fees: "$worldInfo.fees",
//             worldName: "$worldInfo.worldName",
//             charge: "$worldInfo.charge",
//           },
//         },
//       },
//     },

//     // Lookup payment information
//     {
//       $lookup: {
//         from: "payments",
//         localField: "paymentId",
//         foreignField: "_id",
//         as: "paymentInfo",
//       },
//     },

//     {
//       $unwind: { path: "$paymentInfo", preserveNullAndEmptyArrays: true },
//     },

//     // Project only necessary fields
//     {
//       $project: {
//         _id: 1,
//         allocatedBed: 1,
//         paymentId: 1,
//         allocatedBedDetails: 1,
//         "paymentInfo._id": 1,
//         "paymentInfo.totalAmount": 1,
//         "paymentInfo.totalPaid": 1,
//         "paymentInfo.dueAmount": 1,
//         "paymentInfo.payments": 1,
//         "paymentInfo.createdAt": 1,
//         admissionDate: 1,
//         regNo: 1,
//         name: 1,
//       },
//     },
//   ];

//   const result = await Admission.aggregate(aggregatePipeline);
//   return result;
// };

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
  getAllAdmissionFromDB,
  createAdmissionIntoDB,
  updateAdmissonIntoDB,
  deleteAdmissionFromDB,
};
