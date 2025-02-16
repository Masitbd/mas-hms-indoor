import { Request, Response } from "express";
import catchAsync from "../../../utis/catchAsync";
import { BedServices } from "./bed.service";
import sendResponse from "../../../utis/sendResponse";
import status from "http-status";

const createBed = catchAsync(async (req: Request, res: Response) => {
  const result = await BedServices.createBedIntoDB(req.body);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Bed Created Successfully",
    data: result,
  });
});
const getAllBeds = catchAsync(async (req: Request, res: Response) => {
  const result = await BedServices.getAllBedsFromDB();

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Bed Retrived Successfully",
    data: result,
  });
});
const getSingleBed = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BedServices.getBedByWorldNameAndAvailablityFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Bed Retrived Successfully",
    data: result,
  });
});
const updateBed = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BedServices.updateBedsIntoDB(id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Bed Updated Successfully",
    data: result,
  });
});

const deleteBed = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await BedServices.deleteBedFromDB(id);

  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Bed Deleted Successfully",
    data: result,
  });
});

export const BedControllers = {
  createBed,
  getAllBeds,
  getSingleBed,
  updateBed,
  deleteBed,
};
