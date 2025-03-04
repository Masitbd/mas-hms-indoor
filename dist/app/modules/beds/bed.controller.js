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
exports.BedControllers = void 0;
const catchAsync_1 = __importDefault(require("../../../utis/catchAsync"));
const bed_service_1 = require("./bed.service");
const sendResponse_1 = __importDefault(require("../../../utis/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const createBed = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield bed_service_1.BedServices.createBedIntoDB(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Bed Created Successfully",
        data: result,
    });
}));
const getAllBeds = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield bed_service_1.BedServices.getAllBedsFromDB();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Bed Retrived Successfully",
        data: result,
    });
}));
const getSingleBed = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield bed_service_1.BedServices.getBedByWorldNameAndAvailablityFromDB(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Bed Retrived Successfully",
        data: result,
    });
}));
const updateBed = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield bed_service_1.BedServices.updateBedsIntoDB(id, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Bed Updated Successfully",
        data: result,
    });
}));
const deleteBed = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield bed_service_1.BedServices.deleteBedFromDB(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Bed Deleted Successfully",
        data: result,
    });
}));
exports.BedControllers = {
    createBed,
    getAllBeds,
    getSingleBed,
    updateBed,
    deleteBed,
};
