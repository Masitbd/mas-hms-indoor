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
exports.BedServices = void 0;
const bed_model_1 = require("./bed.model");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const bedConstance_1 = require("./bedConstance");
const createBedIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield bed_model_1.Bed.create(payload);
    return result;
});
// get all beds
const getAllBedsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryParams = {
        isDeleted: false,
        isAllocated: false,
    };
    const bedQuery = new QueryBuilder_1.default(bed_model_1.Bed.find(queryParams).select("-isDeleted").populate("worldId", "worldName"), query).filter();
    const result = yield bedQuery.modelQuery;
    return result;
});
const getAllBedsForAdminFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const bedQuery = new QueryBuilder_1.default(bed_model_1.Bed.find({ isDeleted: false })
        .select("-isDeleted")
        .populate("worldId", "worldName"), query)
        .search(bedConstance_1.bedSearchablefields)
        .filter();
    const result = yield bedQuery.modelQuery;
    return result;
});
//  update
const updateBedsIntoDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield bed_model_1.Bed.findByIdAndUpdate(id, payload, { new: true });
});
// delete bed
const deleteBedFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield bed_model_1.Bed.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    return result;
});
exports.BedServices = {
    createBedIntoDB,
    getAllBedsFromDB,
    getAllBedsForAdminFromDB,
    updateBedsIntoDB,
    deleteBedFromDB,
};
