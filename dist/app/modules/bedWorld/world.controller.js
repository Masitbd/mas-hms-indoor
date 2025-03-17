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
exports.worldControllers = void 0;
const catchAsync_1 = __importDefault(require("../../../utis/catchAsync"));
const sendResponse_1 = __importDefault(require("../../../utis/sendResponse"));
const world_service_1 = require("./world.service");
const createWorld = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // console.log(req.body);
    const result = yield world_service_1.worldServices.createBedWorldIntoDB(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 201,
        message: "World created successfully",
        data: result,
    });
}));
const getAllWorld = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield world_service_1.worldServices.getAllBedWorldFromDB();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "World retrived successfully",
        data: result,
    });
}));
const getSingleWorld = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield world_service_1.worldServices.getBedWorldByIdFromDB(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "World retrived successfully",
        data: result,
    });
}));
const updateWorld = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield world_service_1.worldServices.updateBedWorldIntoDB(id, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "World updated successfully",
        data: result,
    });
}));
const deleteWorld = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield world_service_1.worldServices.deleteBedWorldFromDB(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: 200,
        message: "World deleted successfully",
        data: result,
    });
}));
exports.worldControllers = {
    createWorld,
    getAllWorld,
    getSingleWorld,
    updateWorld,
    deleteWorld,
};
