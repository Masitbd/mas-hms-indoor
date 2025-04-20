"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.financialReportsControllers = void 0;
const catchAsync_1 = __importDefault(require("../../../utis/catchAsync"));
const financialReporrts_service_1 = require("./financialReporrts.service");
const sendResponse_1 = __importDefault(require("../../../utis/sendResponse"));
const getPaymentBydateAndreceiver = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield financialReporrts_service_1.financialReportsServices.getIndoorIncomeStatementFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        data: result,
        message: "Retrived payment details",
    });
}));
const getDailyCollection = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield financialReporrts_service_1.financialReportsServices.getDailyCollectionFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        data: result,
        message: "Retrived daily collecton",
    });
}));
const getDueCollectionStatement = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield financialReporrts_service_1.financialReportsServices.getDueCollectionStatementFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        data: result,
        message: "Retrived daily collecton",
    });
}));
//
const getDueStatement = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield financialReporrts_service_1.financialReportsServices.getDueStatementFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: 200,
        success: true,
        data: result,
        message: "Retrived Indoor Due details",
    });
}));
exports.financialReportsControllers = {
    getPaymentBydateAndreceiver,
    getDueStatement,
    getDailyCollection,
    getDueCollectionStatement
};
