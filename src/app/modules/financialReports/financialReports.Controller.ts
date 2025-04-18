import { Request, Response } from "express";
import catchAsync from "../../../utis/catchAsync";
import { financialReportsServices } from "./financialReporrts.service";
import sendResponse from "../../../utis/sendResponse";

const getPaymentBydateAndreceiver = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await financialReportsServices.getIndoorIncomeStatementFromDB(req.query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: result,
      message: "Retrived payment details",
    });
  }
);
const getDailyCollection = catchAsync(async (req: Request, res: Response) => {
  const result = await financialReportsServices.getDailyCollectionFromDB(
    req.query
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    data: result,
    message: "Retrived daily collecton",
  });
});
const getDueCollectionStatement = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await financialReportsServices.getDueCollectionStatementFromDB(req.query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: result,
      message: "Retrived daily collecton",
    });
  }
);

//

const getDueStatement = catchAsync(async (req: Request, res: Response) => {
  const result = await financialReportsServices.getDueStatementFromDB(
    req.query
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    data: result,
    message: "Retrived Indoor Due details",
  });
});

export const financialReportsControllers = {
  getPaymentBydateAndreceiver,
  getDueStatement,
  getDailyCollection,
  getDueCollectionStatement
};
