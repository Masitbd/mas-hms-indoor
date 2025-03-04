"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sendResponse = (res, jsonData) => {
    res.status(jsonData.statusCode).json({
        success: jsonData.success,
        statusCode: jsonData.statusCode,
        message: jsonData.message,
        data: jsonData.data,
        meta: jsonData.meta,
    });
};
exports.default = sendResponse;
