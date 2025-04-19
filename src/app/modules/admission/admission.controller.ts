import { Request, Response } from "express";
import catchAsync from "../../../utis/catchAsync";
import { AdmissionServices } from "./admission.service";
import sendResponse from "../../../utis/sendResponse";
import status from "http-status";

const createAdmission = catchAsync(async (req: Request, res: Response) => {
  const result = await AdmissionServices.createAdmissionIntoDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Created Succesfully",
    data: result,
  });
});
const releasePatient = catchAsync(async (req: Request, res: Response) => {
  const result = await AdmissionServices.realeasePatientFromDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Released Succesfully",
    data: result,
  });
});

const getAllAdmissionInfo = catchAsync(async (req: Request, res: Response) => {
  const result = await AdmissionServices.getAllAdmissionFromDB(req.query);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Retrived Succesfully",
    data: result,
  });
});
const getAdmissionInfo = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AdmissionServices.getAdmissionInfoFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Retrived Succesfully",
    data: result,
  });
});
const getTodayAdmitPatients = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdmissionServices.getTodayAdmittedPatientFromDB();
    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Retrived Today's patient Succesfully",
      data: result,
    });
  }
);
const getAdmitPatientsOverAPeriod = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdmissionServices.getAdmittedPatientOverAPeriodFromDB(
      req.query
    );
    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Retrived Patient over a period Succesfully",
      data: result,
    });
  }
);

const updteAdmisison = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await AdmissionServices.updateAdmissonIntoDB(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Updated Succesfully",
    data: result,
  });
});

const transferPatientBed = catchAsync(async (req: Request, res: Response) => {
  const result = await AdmissionServices.transferPatientBedFromDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Transferred Succesfully",
    data: result,
  });
});

const deleteAdmission = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await AdmissionServices.deleteAdmissionFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Deleted Succesfully",
  });
});

export const AdmissionControllers = {
  createAdmission,
  releasePatient,
  getAdmissionInfo,
  getAllAdmissionInfo,
  getTodayAdmitPatients,
  getAdmitPatientsOverAPeriod,
  updteAdmisison,
  transferPatientBed,
  deleteAdmission,
};
