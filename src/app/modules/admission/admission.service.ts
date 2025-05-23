import { admissonSearchableFields } from "./admission.constance";
import mongoose, { PipelineStage, Schema, Types } from "mongoose";
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
import axios from "axios";
import { config } from "../../config";

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
  uuid: any;
  patientType: any;
  patient: any;
  regNo: string;
  allocatedBed?: string;
  services: ServicePayload[];
  totalBill: number;
  consultant: Schema.Types.ObjectId;
  servicedBy: string;
  refDoct: Schema.Types.ObjectId;
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
    const { _id, createdAt, updatedAt, ...cleanPayload } = payload;

    const result = await Admission.create([{ ...cleanPayload }], { session });

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

    {
      $lookup: {
        from: "packageitems",
        localField: "fixedBill",
        foreignField: "_id",
        as: "packageItemInfo",
      },
    },
    {
      $unwind: { path: "$packageItemInfo", preserveNullAndEmptyArrays: true },
    },

    {
      $addFields: {
        totalAmount: {
          $cond: {
            if: { $ifNull: ["$packageItemInfo.price", false] },

            then: "$packageItemInfo.price",
            else: {
              $subtract: [
                {
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
                    { $ifNull: ["$paymentInfo.serviceAmount", 0] },
                    {
                      $cond: {
                        if: { $gt: ["$daysStayed", 0] },
                        then: { $ifNull: ["$paymentInfo.totalAmount", 0] },
                        else: 0,
                      },
                    },
                  ],
                },
                { $ifNull: ["$paymentInfo.discountAmount", 0] },
              ],
            },
          },
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

    {
      $unwind: { path: "$services", preserveNullAndEmptyArrays: true },
    },
    {
      $set: {
        serviceObjectId: {
          $cond: {
            if: { $eq: [{ $type: "$services.serviceId" }, "string"] },
            then: { $toObjectId: "$services.serviceId" },
            else: "$services.serviceId", // if already ObjectId, keep as it is
          },
        },
      },
    },

    {
      $lookup: {
        from: "tests",
        localField: "serviceObjectId",
        foreignField: "_id",
        as: "serviceInfo",
      },
    },
    { $unwind: { path: "$serviceInfo", preserveNullAndEmptyArrays: true } },

    {
      $addFields: {
        "services.label": "$serviceInfo.label",
      },
    },

    {
      $group: {
        _id: "$_id",
        allocatedBed: { $first: "$allocatedBed" },
        paymentId: { $first: "$paymentId" },
        allocatedBedDetails: { $first: "$allocatedBedDetails" },
        totalAmount: { $first: "$totalAmount" },
        daysStayed: { $first: "$daysStayed" },
        paymentInfo: { $first: "$paymentInfo" },
        admissionDate: { $first: "$admissionDate" },
        admissionTime: { $first: "$admissionTime" },
        regNo: { $first: "$regNo" },
        age: { $first: "$age" },
        patientType: { $first: "$patientType" },
        phone: { $first: "$phone" },
        uuid: { $first: "$uuid" },
        gender: { $first: "$gender" },
        address: { $first: "$presentAddress" },
        assignDoct: { $first: "$assignDoct" },
        refDoct: { $first: "$refDoct" },
        name: { $first: "$name" },
        status: { $first: "$status" },
        isTransfer: { $first: "$isTransfer" },
        transferInfo: { $first: "$transferInfo" },

        services: {
          $push: {
            $cond: {
              if: { $ifNull: ["$services", false] },
              then: {
                _id: "$services._id",
                serviceId: "$services.serviceId",
                quantity: "$services.quantity",
                rate: "$services.rate",
                total: "$services.amount",
                label: "$services.label",
              },
              else: "$$REMOVE",
            },
          },
        },
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

const addServicesToPatientIntoDB = async (
  payload: AddServicePayload,
  token: string
) => {
  const session = await mongoose.startSession();

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

    // ! added call order id here

    const investigationServices = services?.filter(
      (s) => s.serviceCategory === "investigation"
    );

    if (investigationServices && investigationServices.length > 0) {
      const tests = investigationServices.map((s, index) => ({
        SL: index + 1,
        test: s.serviceId,
        status: "pending",
        discount: s.discount || 0,
        deliveryTime: null,
        remark: "",
      }));

      const totalPrice = investigationServices.reduce(
        (sum, s) => sum + (s.amount || 0),
        0
      );

      const orderPayload = {
        tests,
        totalPrice,
        cashDiscount: 0,
        parcentDiscount: 0,
        deliveryTime: new Date(),
        status: "pending",
        dueAmount: 0,
        paid: 0,
        vat: 0,
        refBy: payload.refDoct,
        consultant: payload.consultant,
        uuid: payload.uuid,
        remarks: payload.regNo,
        patientType: payload.patientType,
        discountedBy: "system",
        postedBy: payload.servicedBy,
        tubePrice: 0,
        patient: payload.patient,
      };

      await axios.post(`${config.backend_url}/order`, orderPayload, {
        headers: {
          Authorization: token,
        },
        withCredentials: true,
      });
    }

    // ? end

    // Update Admission
    const updated = await Admission.updateOne({ regNo }, updateData, {
      session,
    });

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
