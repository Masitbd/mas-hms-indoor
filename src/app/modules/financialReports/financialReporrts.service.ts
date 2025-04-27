import mongoose, { PipelineStage } from "mongoose";
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

        bedName: { $first: "$bedInfo.bedName" },
        // totalBill: { $first: "$totalAmount" },
        totalPaid: { $first: "$totalPaid" },
        admissionDate: { $first: "$patientInfo.admissionDate" },
        releaseDate: { $first: "$patientInfo.releaseDate" },
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
const getDailyCollectionFromDB = async (query: Record<string, any>) => {
  const startDate = query.startDate ? new Date(query.startDate) : new Date();
  const endDate = query.endDate ? new Date(query.endDate) : new Date();

  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  const pipeline: PipelineStage[] = [
    { $unwind: "$payments" },

    {
      $match: {
        "payments.createdAt": {
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
        paymentAmount: "$payments.amount",
        paymentDiscount: "$payments.discount",
        patientRegNo: "$patientRegNo",
      },
    },

    {
      $lookup: {
        from: "profiles",
        localField: "payments.receivedBy",
        foreignField: "uuid",
        as: "userInfo",
      },
    },
    { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },

    // Group by paymentDate + receiver + patientRegNo
    {
      $group: {
        _id: {
          paymentDate: "$paymentDate",
          receiver: "$payments.receivedBy",
          patientRegNo: "$patientRegNo",
          name: "$userInfo.name",
        },
        amount: { $sum: "$paymentAmount" },
        discount: { $sum: "$paymentDiscount" },

        createdAt: { $first: "$payments.createdAt" },
      },
    },

    // Group by paymentDate + receiver
    {
      $group: {
        _id: {
          paymentDate: "$_id.paymentDate",
          receiver: "$_id.receiver",
          name: "$_id.name",
        },
        patients: {
          $push: {
            name: "$_id.name",
            regNo: "$_id.patientRegNo",
            amount: "$amount",
            discount: "$discount",
            createdAt: "$createdAt",
          },
        },
        totalAmountPaid: { $sum: "$amount" },
        // totalDiscount: { $sum: "$discount" },
      },
    },

    // Group by paymentDate (final structure: date -> receiver -> patients[])
    {
      $group: {
        _id: "$_id.paymentDate",
        receivers: {
          $push: {
            receiver: "$_id.name",
            totalAmountPaid: "$totalAmountPaid",
            totalDiscount: "$totalDiscount",
            records: "$patients",
          },
        },
        dailyTotalAmountPaid: { $sum: "$totalAmountPaid" },
        dailyTotalDiscount: { $sum: "$totalDiscount" },
      },
    },

    {
      $project: {
        paymentDate: "$_id",
        receivers: 1,
        dailyTotalAmountPaid: 1,
        dailyTotalDiscount: 1,
        _id: 0,
      },
    },

    { $sort: { paymentDate: -1 } },
  ];

  const result = await Payment.aggregate(pipeline);
  return result;
};

// Indoor Due Collection Statement
const getDueCollectionStatementFromDB = async (query: Record<string, any>) => {
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
        "payments.purpose": "due-collection",
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
        name: { $first: "$patientInfo.name" },
        releaseDate: { $first: "$patientInfo.releaseDate" },
      },
    },

    // 8. Group by paymentDate only (for daily totals)
    {
      $group: {
        _id: "$_id.paymentDate",
        records: {
          $push: {
            regNo: "$_id.patientRegNo",
            name: "$name",
            amount: "$amount", // Summed amount for this patient
            discount: "$discount",
            bedName: "$bedName",

            totalPaid: { $sum: "$amount" },
            admissionDate: "$admissionDate",
            releaseDate: "$releaseDate",
          },
        },
        totalAmountPaid: { $sum: "$amount" }, // Sum all patients' payments
        totalDiscount: { $sum: "$discount" },

        totalPaid: { $sum: "$totalPaid" },
      },
    },

    // 9. Calculate due amount
    // {
    //   $addFields: {
    //     dueAmount: { $subtract: ["$totalBill", "$totalAmountPaid"] },
    //   },
    // },

    // 12. Final projection
    {
      $project: {
        paymentDate: "$_id",
        records: 1,
        totalAmountPaid: 1,
        totalDiscount: 1,
        totalBill: 1,
        totalPaid: 1,
        // dueAmount: 1,
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

// patient hospital bill summery

const getPatientHospitalBillSummeryFromDB = async (id: string) => {
  // aggregate pipleline

  const pipleLine: PipelineStage[] = [
    // mathc
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },

    // lookup bed info
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
    //

    {
      $lookup: {
        from: "doctors",
        localField: "refDoct",
        foreignField: "_id",
        as: "doctInfo",
      },
    },

    {
      $unwind: { path: "$doctInfo", preserveNullAndEmptyArrays: true },
    },

    {
      $lookup: {
        from: "payments",
        localField: "regNo",
        foreignField: "patientRegNo",
        as: "paymentInfo",
      },
    },
    {
      $unwind: { path: "$paymentInfo", preserveNullAndEmptyArrays: true },
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
      $addFields: {
        bedCharge: {
          $cond: {
            if: { $gte: ["$daysStayed", 0] },
            then: { $multiply: ["$daysStayed", "$worldInfo.fees"] },
            else: 0,
          },
        },
      },
    },

    // service unwind

    {
      $unwind: {
        path: "$services",
        preserveNullAndEmptyArrays: true,
      },
    },
    // service group

    {
      $group: {
        _id: "$services.serviceCategory",
        serviceTotal: { $sum: "$services.amount" },
        general: { $first: "$worldInfo.charge" },
        regNo: { $first: "$regNo" },
        name: { $first: "$name" },
        guradin: { $first: "$fatherName" },
        admissionDate: { $first: "$admissionDate" },
        releaseDate: { $first: "$releaseDate" },
        bedName: { $first: "$bedInfo.bedName" },
        bedCharge: { $first: "$bedCharge" },
        refDoct: { $first: "$doctInfo.name" },
        totalPaid: { $first: "$paymentInfo.totalPaid" },
      },
    },

    // final group

    {
      $group: {
        _id: null,
        serviceSummary: {
          $push: {
            category: "$_id",
            total: "$serviceTotal",
          },
        },
        general: { $first: "$general" },
        regNo: { $first: "$regNo" },
        name: { $first: "$name" },
        guradin: { $first: "$guradin" },
        admissionDate: { $first: "$admissionDate" },
        releaseDate: { $first: "$releaseDate" },
        bedName: { $first: "$bedName" },
        bedCharge: { $first: "$bedCharge" },
        refDoct: { $first: "$refDoct" },
        totalPaid: { $first: "$totalPaid" },
      },
    },
  ];
  const result = await Admission.aggregate(pipleLine);
  return result;
};

// hospital bill details

const getPatientHospitalBillDetailsFromDB = async (id: string) => {
  // aggregate pipleline

  const pipleLine: PipelineStage[] = [
    // mathc
    {
      $match: {
        _id: new mongoose.Types.ObjectId(id),
      },
    },

    // lookup bed info
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
    //

    {
      $lookup: {
        from: "doctors",
        localField: "refDoct",
        foreignField: "_id",
        as: "doctInfo",
      },
    },

    {
      $unwind: { path: "$doctInfo", preserveNullAndEmptyArrays: true },
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
      $addFields: {
        bedCharge: {
          $cond: {
            if: { $gte: ["$daysStayed", 0] },
            then: { $multiply: ["$daysStayed", "$worldInfo.fees"] },
            else: 0,
          },
        },
      },
    },

    // service unwind

    {
      $unwind: {
        path: "$services",
        preserveNullAndEmptyArrays: true,
      },
    },
    // service group
    {
      $addFields: {
        "services.serviceIdObj": {
          $cond: {
            if: { $ne: ["$services.serviceId", ""] },
            then: { $toObjectId: "$services.serviceId" },
            else: null,
          },
        },
      },
    },

    {
      $lookup: {
        from: "tests",
        localField: "services.serviceIdObj",
        foreignField: "_id",
        as: "testInfo",
      },
    },
    {
      $unwind: { path: "$testInfo", preserveNullAndEmptyArrays: true },
    },
    // !

    {
      $lookup: {
        from: "payments",
        localField: "regNo",
        foreignField: "patientRegNo",
        as: "paymentInfo",
      },
    },
    {
      $unwind: { path: "$paymentInfo", preserveNullAndEmptyArrays: true },
    },

    {
      $group: {
        _id: "$services.serviceCategory",
        services: {
          $push: {
            date: "$services.createdAt",
            serviceAmount: "$services.amount",
            quantity: "$services.quantity",
            name: "$testInfo.label",
            total: "$services.amount",
          },
        },
        general: { $first: "$worldInfo.charge" },
        regNo: { $first: "$regNo" },
        name: { $first: "$name" },
        age: { $first: "$age" },
        gender: { $first: "$gender" },
        guradin: { $first: "$fatherName" },
        admissionDate: { $first: "$admissionDate" },
        releaseDate: { $first: "$releaseDate" },
        bedName: { $first: "$bedInfo.bedName" },
        bedCharge: { $first: "$bedCharge" },
        refDoct: { $first: "$doctInfo.name" },
        totalPaid: { $first: "$paymentInfo.totalPaid" },
      },
    },

    // Final grouping — combine all service categories
    {
      $group: {
        _id: null,
        groupedServices: {
          $push: {
            category: "$_id",
            services: "$services",
          },
        },
        general: { $first: "$general" },
        regNo: { $first: "$regNo" },
        name: { $first: "$name" },
        age: { $first: "$age" },
        gender: { $first: "$gender" },
        guradin: { $first: "$guradin" },
        admissionDate: { $first: "$admissionDate" },
        releaseDate: { $first: "$releaseDate" },
        bedName: { $first: "$bedName" },
        totalPaid: { $first: "$totalPaid" },
        bedCharge: { $first: "$bedCharge" },
        refDoct: { $first: "$refDoct" },
      },
    },
  ];
  const result = await Admission.aggregate(pipleLine);
  return result;
};

// patient doctor bill

const getPatientDoctorBillsFromDB = async (id: string) => {
  const result = await Admission.aggregate([
    // Match the specific admission
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
    // Unwind bed info array to a single object
    {
      $unwind: {
        path: "$bedInfo",
        preserveNullAndEmptyArrays: true,
      },
    },
    // Unwind services to work with them individually
    {
      $unwind: {
        path: "$services",
        preserveNullAndEmptyArrays: true,
      },
    },
    // Filter only doctor's related services
    {
      $match: {
        "services.serviceCategory": "doctor's related",
      },
    },
    // Convert string IDs to ObjectIds for lookups
    {
      $addFields: {
        "services.doctorIdObj": {
          $cond: {
            if: { $ne: ["$services.doctorId", ""] },
            then: { $toObjectId: "$services.doctorId" },
            else: null,
          },
        },
        "services.serviceIdObj": { $toObjectId: "$services.serviceId" },
      },
    },
    // Lookup doctor information using the converted ObjectId
    {
      $lookup: {
        from: "doctors",
        localField: "services.doctorIdObj",
        foreignField: "_id",
        as: "doctorInfo",
      },
    },

    {
      $unwind: {
        path: "$doctorInfo",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "tests",
        localField: "services.serviceIdObj",
        foreignField: "_id",
        as: "testInfo",
      },
    },
    {
      $unwind: {
        path: "$testInfo",
        preserveNullAndEmptyArrays: true,
      },
    },

    {
      $lookup: {
        from: "payments",
        localField: "regNo",
        foreignField: "patientRegNo",
        as: "paymentInfo",
      },
    },
    {
      $unwind: { path: "$paymentInfo", preserveNullAndEmptyArrays: true },
    },

    {
      $project: {
        _id: 0,
        doctorName: "$doctorInfo.name",
        speciality: "$doctorInfo.speciality",
        visitType: "$testInfo.label",
        bedName: "$bedInfo.bedName",
        amount: "$services.amount",
        name: "$name",
        regNo: "$regNo",
        quantity: "$services.quantity",
        totalPaid: "$paymentInfo.totalPaid",

        createdAt: "$services.createdAt",
      },
    },
  ]);

  return result;
};
export const financialReportsServices = {
  getIndoorIncomeStatementFromDB,
  getDueStatementFromDB,
  getDailyCollectionFromDB,
  getDueCollectionStatementFromDB,
  getPatientHospitalBillSummeryFromDB,
  getPatientHospitalBillDetailsFromDB,
  getPatientDoctorBillsFromDB,
};
