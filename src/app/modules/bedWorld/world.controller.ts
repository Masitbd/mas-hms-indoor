import catchAsync from "../../../utis/catchAsync";
import sendResponse from "../../../utis/sendResponse";
import { worldServices } from "./world.service";

const createWorld = catchAsync(async (req, res) => {
  // console.log(req.body);
  const result = await worldServices.createBedWorldIntoDB(req.body);
  sendResponse(res, {
    success: true,
    statusCode: 201,
    message: "World created successfully",
    data: result,
  });
});

const getAllWorld = catchAsync(async (req, res) => {
  const result = await worldServices.getAllBedWorldFromDB();
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "World retrived successfully",
    data: result,
  });
});

const getSingleWorld = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await worldServices.getBedWorldByIdFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "World retrived successfully",
    data: result,
  });
});

const updateWorld = catchAsync(async (req, res) => {
  const { id } = req.params;

  const result = await worldServices.updateBedWorldIntoDB(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "World updated successfully",
    data: result,
  });
});

const deleteWorld = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await worldServices.deleteBedWorldFromDB(id);
  sendResponse(res, {
    success: true,
    statusCode: 200,
    message: "World deleted successfully",
    data: result,
  });
});

export const worldControllers = {
  createWorld,
  getAllWorld,
  getSingleWorld,
  updateWorld,
  deleteWorld,
};
