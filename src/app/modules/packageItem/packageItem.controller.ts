import { Request, Response } from "express";
import catchAsync from "../../../utis/catchAsync";
import { packageServices } from "./packageItem.service";
import sendResponse from "../../../utis/sendResponse";

const createPackage = catchAsync(async (req: Request, res: Response) => {
  const result = await packageServices.createPackageIntoDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Created Successfully",
    data: result,
  });
});
const getAllPackage = catchAsync(async (req: Request, res: Response) => {
  const result = await packageServices.getAllPackageFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Retrived Successfully",
    data: result,
  });
});
const updatePackage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await packageServices.updatePackageIntoDB(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "updated Successfully",
    data: result,
  });
});
const deletePackage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await packageServices.deletePackageFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "deleted Successfully",
    data: result,
  });
});

const getSinglePackage = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await packageServices.getSinglePackage(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Retrieved Successfully",
    data: result,
  });
});
//

export const packageController = {
  createPackage,
  getAllPackage,
  updatePackage,
  deletePackage,
  getSinglePackage,
};
