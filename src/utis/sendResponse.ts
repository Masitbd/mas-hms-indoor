import { Response } from "express";

type TResponseData<T> = {
  success: boolean;
  statusCode: number;
  message?: string;
  data?: T | null | undefined;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
};

const sendResponse = <T>(res: Response, jsonData: TResponseData<T>) => {
  res.status(jsonData.statusCode).json({
    success: jsonData.success,
    statusCode: jsonData.statusCode,
    message: jsonData.message,
    data: jsonData.data,
    meta: jsonData.meta,
  });
};

export default sendResponse;
