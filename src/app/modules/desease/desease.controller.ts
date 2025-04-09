import { Request, Response } from "express";
import catchAsync from "../../../utis/catchAsync";
import sendResponse from "../../../utis/sendResponse";
import { deseaseServices } from "./desease.service";

const createDesease = catchAsync(async (req: Request, res: Response) => {
  const result = await deseaseServices.createDeseaseIntoDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Created Successfully",
    data: result,
  });
});
const getAllDesease = catchAsync(async (req: Request, res: Response) => {
  const result = await deseaseServices.getAllDeseaseIntoDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "Retrived Successfully",
    data: result,
  });
});
const updateDesease = catchAsync(async (req: Request, res: Response) => {
  const result = await deseaseServices.updateDeseaseIntoDB(
    req.params.id,
    req.body
  );
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "update Successfully",
    data: result,
  });
});
const deleteDesease = catchAsync(async (req: Request, res: Response) => {
  const result = await deseaseServices.deleteDeseaseIntoDB(req.params.id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "deleted Successfully",
    data: result,
  });
});

export const deseaseController = {
  createDesease,
  getAllDesease,
  updateDesease,
  deleteDesease,
};
