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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedServices = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const bed_model_1 = require("./bed.model");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const createBedIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield bed_model_1.Bed.create(payload);
    return result;
});
// get all beds
const getAllBedsFromDB = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const bedQuery = new QueryBuilder_1.default(bed_model_1.Bed.find().populate("worldId", "worldName"), query).filter();
    const result = yield bedQuery.modelQuery;
    return result;
});
// get by available world Name
const getBedByWorldNameAndAvailablityFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield bed_model_1.Bed.findOne({
        _id: mongoose_1.default.Types.ObjectId.createFromBase64(id),
        beds: { $elemMatch: { isAllocated: false } },
    });
    return result;
});
//  update
const updateBedsIntoDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const _a = payload, { bed, filterBed } = _a, remainingData = __rest(_a, ["bed", "filterBed"]);
    const modifiedData = Object.assign({}, remainingData);
    if (bed && Object.keys(bed)) {
        for (const [key, value] of Object.entries(bed)) {
            modifiedData[`beds.$[bedElem].${key}`] = value;
        }
    }
    const result = yield bed_model_1.Bed.findByIdAndUpdate(id, modifiedData, {
        new: true,
        runValidators: true,
        arrayFilters: [{ "bedEle._id": filterBed === null || filterBed === void 0 ? void 0 : filterBed._id }],
    });
    return result;
});
// delete bed
const deleteBedFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield bed_model_1.Bed.findByIdAndDelete(id);
    return result;
});
exports.BedServices = {
    createBedIntoDB,
    getAllBedsFromDB,
    getBedByWorldNameAndAvailablityFromDB,
    updateBedsIntoDB,
    deleteBedFromDB,
};
