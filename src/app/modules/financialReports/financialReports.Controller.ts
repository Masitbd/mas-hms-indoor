import { Request, Response } from "express";
import catchAsync from "../../../utis/catchAsync";
import { financialReportsServices } from "./financialReporrts.service";
import sendResponse from "../../../utis/sendResponse";

const getPaymentBydateAndreceiver = catchAsync(
  async (req: Request, res: Response) => {
    const result =
      await financialReportsServices.getPaymentStatementGroupedByDateAndReceiver(
        req.query
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      data: result,
      message: "Retrived payment details",
    });
  }
);

export const financialReportsControllers = {
  getPaymentBydateAndreceiver,
};
