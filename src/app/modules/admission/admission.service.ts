import { admissonSearchableFields } from "./admission.constance";
import mongoose, { PipelineStage, Types } from "mongoose";
import { generateRegId } from "../../utils/generateRegId";
import { Bed } from "../beds/bed.model";
import { Payment } from "../payments/payment.model";
import { TPAdmission } from "./admission.interface";
import { Admission } from "./admission.model";

import QueryBuilder from "../../builder/QueryBuilder";
import { TransferBed } from "../bedTransfer/bedTansfer.model";
import ApiError from "../../../errors/ApiError";
import { AccountService } from "../../../shared/axios";
import { journalEntryService } from "../journal-entry/journalEntry.service";

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

interface ServicePayload {
  serviceId: string | Types.ObjectId;
  [key: string]: any; // For extra fields like name, amount, etc.
}

// Main payload from frontend
interface AddServicePayload {
  regNo: string;
  allocatedBed?: string;
  services: ServicePayload[];
  totalBill: number;
}

const createAdmissionIntoDB = async (payload: any) => {
  const session = await mongoose.startSession(); // Start transaction session
  session.startTransaction();

  try {
    const regNo = await generateRegId();

    payload.patientRegNo = regNo;

    if (payload.isTransfer === "") {
      payload.isTransfer = false;
    }
    const paymentPayload: any = {
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

    paymentPayload.dueAmount = Math.max(
      0,
      paymentPayload.totalAmount - paymentPayload.totalPaid
    );
    const createPayment = await Payment.create([paymentPayload], { session });

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

    // calculation of net price
    const netPrice =
      payload.totalAmount -
      (payload?.cashDiscount ?? 0) -
      (payload.totalAmount * (payload.parcentDiscount ?? 0)) / 100;

    const vat = ((netPrice ?? 0) * (payload?.vat ?? 0)) / 100;
    const netPayable = netPrice + vat;

    //! token should be passed in future
    // await journalEntryService.postAdmissionJournalEntry({
    //   due: netPayable - (payload?.paid ?? 0),
    //   orderAmount: netPayable,
    //   paid: payload?.paid ?? 0,
    //   token: "test",
    // });
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
    Admission.find({ status: "admitted" })
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

    // {
    //   $addFields: {
    //     totalAmount: {
    //       $cond: {
    //         if: { $eq: ["$daysStayed", 0] },
    //         then: "$worldInfo.charge",

    //         else: {
    //           $add: [
    //             { $multiply: ["$daysStayed", "$worldInfo.fees"] },
    //             {
    //               $ifNull: [
    //                 "$paymentInfo.totalAmount",
    //                 "$paymentInfoserviceAmount",
    //                 0,
    //               ],
    //             },
    //           ],
    //         },
    //       },
    //     },
    //   },
    // },
    {
      $addFields: {
        totalAmount: {
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

            {
              $ifNull: ["$paymentInfo.serviceAmount", 0],
            },

            {
              $cond: {
                if: { $gt: ["$daysStayed", 0] },
                then: { $ifNull: ["$paymentInfo.totalAmount", 0] },
                else: 0,
              },
            },
          ],
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
        transferInfo: 1,
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
const realeasePatientFromDB = async (option: {
  id: string;
  bedId: string;
  authorPerson?: string;
}) => {
  const { id, bedId, authorPerson } = option;
  const session = await mongoose.startSession(); // Start transaction session
  session.startTransaction();

  try {
    const result = await Admission.findByIdAndUpdate(
      id,
      {
        status: "released",
        releaseDate: new Date().toISOString(),
        authorPerson,
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
    const transferInfo = await TransferBed.findOneAndUpdate(
      { patientId: id },
      {
        $push: {
          transferInfo: {
            previousBed,
            newBed: allocatedBed,
            admissionDate,
            totalAmount,
            dayStayed,
          },
        },
      },
      { upsert: true, new: true, session }
    );

    const previousAdmission = await Admission.findOneAndUpdate(
      { regNo: payload.patientRegNo },
      {
        allocatedBed: payload.allocatedBed,
        isTransfer: true,
        admissionDate: new Date().toISOString(),
        admissionTime: new Date().toISOString(),
        firstAdmitDate: payload.admissionDate,
        tranferInfo: transferInfo?._id,
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
      ],
      { new: true, session }
    );

    // transfer info add

    await session.commitTransaction();
    await session.endSession();

    //Posting the amount to the account server
    await journalEntryService.postJournalEntryForBedTransfer({
      amount: payload?.totalAmount ?? 0,
      token: "test",
    });
    return previousAdmission;
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw error;
  }
};

// today's admitted patient

const getTodayAdmittedPatientFromDB = async () => {
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

  const result = await Admission.aggregate(aggregatePipeline);
  return result;
};
// get patient over a period

const getAdmittedPatientOverAPeriodFromDB = async (
  query: Record<string, any>
) => {
  const startDate = query.startDate ? new Date(query.startDate) : new Date();
  const endDate = query.endDate ? new Date(query.endDate) : new Date();

  const aggregatePipeline: PipelineStage[] = [
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

  const result = await Admission.aggregate(aggregatePipeline);
  return result;
};

// add service

const addServicesToPatientIntoDB = async (payload: AddServicePayload) => {
  const session = await mongoose.startSession();

  // console.log(payload, "payload");
  session.startTransaction();
  try {
    const { regNo, services = [] } = payload;

    if (!regNo || !services) {
      throw new ApiError(400, "Need RegNo and Service");
    }

    const incomingServiceIds = services.map((s) => s.serviceId);

    const existing = await Admission.findOne(
      {
        regNo,
        "services.serviceId": { $in: incomingServiceIds },
      },
      { "services.serviceId": 1 }
    ).lean();

    const existingIdsSet = new Set(
      (existing?.services || []).map((s: any) => s.serviceId.toString())
    );

    const newServices = services.filter(
      (s) => !existingIdsSet.has(s.serviceId.toString())
    );

    if (newServices.length === 0) {
      throw new ApiError(400, "Already Exist");
    }

    const servicesToAdd = newServices.map((s) => ({
      ...s,
    }));

    // Update bed allocation
    if (payload.allocatedBed) {
      await Bed.findByIdAndUpdate(
        payload.allocatedBed,
        { isAllocated: true },
        { new: true, session }
      );
    }

    // Update Payment
    await Payment.findOneAndUpdate(
      { patientRegNo: payload.regNo },
      { $inc: { serviceAmount: payload.totalBill } },
      { new: true, session }
    );

    const updateData: any = {
      $push: { services: { $each: servicesToAdd } },
    };

    if (payload.allocatedBed) {
      updateData.$set = {
        allocatedBed: payload.allocatedBed,
      };
    }

    // Update Admission
    const updated = await Admission.updateOne({ regNo }, updateData, {
      session,
    });

    // If you want to post a journal entry after successful DB ops,
    // move it **after commitTransaction()**

    await session.commitTransaction();
    session.endSession();

    // await journalEntryService.postJournalEntryForServiceAdd({
    //   amount: payload.totalBill ?? 0,
    //   token: "test",
    // });

    return updated;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const AdmissionServices = {
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
