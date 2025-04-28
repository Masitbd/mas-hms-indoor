import { Request, Response } from "express";
import catchAsync from "../../../utis/catchAsync";
import { PaymentServices } from "./payment.service";
import sendResponse from "../../../utis/sendResponse";
import status from "http-status";

const getAllPaymentInfo = catchAsync(async (req: Request, res: Response) => {
  const result =
    await PaymentServices.getAllPayementInfoWithPatientInfoFromDB();
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Payment retrived sucessfully",
    data: result,
  });
});

// update

const updatePaymentInfo = catchAsync(async (req: Request, res: Response) => {
  const { regno } = req.params;

  const result = await PaymentServices.updatePaymentAUserIntoDB(
    regno,
    req.body
  );
  sendResponse(res, {
    success: true,
    statusCode: status.OK,
    message: "Payment updated sucessfully",
    data: result,
  });
});
const updatePatientDiscount = catchAsync(
  async (req: Request, res: Response) => {
    const { patientRegNo } = req.params;

    const result = await PaymentServices.updatePatientDiscountInfoDB(
      patientRegNo,
      req.body
    );
    sendResponse(res, {
      success: true,
      statusCode: status.OK,
      message: "Payment updated sucessfully",
      data: result,
    });
  }
);

// export

export const PaymentControllers = {
  getAllPaymentInfo,
  updatePaymentInfo,
  updatePatientDiscount,
};
