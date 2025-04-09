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
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageServices = void 0;
const packageItem_model_1 = require("./packageItem.model");
const createPackageIntoDB = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield packageItem_model_1.PackageItem.create(payload);
});
const getAllPackageFromDB = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield packageItem_model_1.PackageItem.find();
});
const updatePackageIntoDB = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    return yield packageItem_model_1.PackageItem.findByIdAndUpdate(id, payload, { new: true });
});
const deletePackageFromDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield packageItem_model_1.PackageItem.findByIdAndDelete(id);
});
exports.packageServices = {
    createPackageIntoDB,
    getAllPackageFromDB,
    updatePackageIntoDB,
    deletePackageFromDB,
};
