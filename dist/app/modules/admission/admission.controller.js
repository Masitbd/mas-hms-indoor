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
exports.AdmissionControllers = void 0;
const catchAsync_1 = __importDefault(require("../../../utis/catchAsync"));
const admission_service_1 = require("./admission.service");
const sendResponse_1 = __importDefault(require("../../../utis/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const createAdmission = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admission_service_1.AdmissionServices.createAdmissionIntoDB(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Created Succesfully",
        data: result,
    });
}));
const releasePatient = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admission_service_1.AdmissionServices.realeasePatientFromDB(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Released Succesfully",
        data: result,
    });
}));
const getAllAdmissionInfo = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admission_service_1.AdmissionServices.getAllAdmissionFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Retrived Succesfully",
        data: result,
    });
}));
const getAdmissionInfo = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield admission_service_1.AdmissionServices.getAdmissionInfoFromDB(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Retrived Succesfully",
        data: result,
    });
}));
const getTodayAdmitPatients = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admission_service_1.AdmissionServices.getTodayAdmittedPatientFromDB();
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Retrived Today's patient Succesfully",
        data: result,
    });
}));
const getAdmitPatientsOverAPeriod = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admission_service_1.AdmissionServices.getAdmittedPatientOverAPeriodFromDB(req.query);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Retrived Patient over a period Succesfully",
        data: result,
    });
}));
const updteAdmisison = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield admission_service_1.AdmissionServices.updateAdmissonIntoDB(id, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Updated Succesfully",
        data: result,
    });
}));
const addServicesToPatient = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const result = yield admission_service_1.AdmissionServices.addServicesToPatientIntoDB(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Updated Succesfully",
        data: result,
    });
}));
const transferPatientBed = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield admission_service_1.AdmissionServices.transferPatientBedFromDB(req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Transferred Succesfully",
        data: result,
    });
}));
const deleteAdmission = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    yield admission_service_1.AdmissionServices.deleteAdmissionFromDB(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: "Deleted Succesfully",
    });
}));
exports.AdmissionControllers = {
    createAdmission,
    releasePatient,
    getAdmissionInfo,
    getAllAdmissionInfo,
    getTodayAdmitPatients,
    getAdmitPatientsOverAPeriod,
    addServicesToPatient,
    updteAdmisison,
    transferPatientBed,
    deleteAdmission,
};
