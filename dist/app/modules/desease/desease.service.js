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
exports.deseaseServices = void 0;
const desease_model_1 = require("./desease.model");
const createDeseaseIntoDB = (paylaod) => __awaiter(void 0, void 0, void 0, function* () {
    return yield desease_model_1.Desease.create(paylaod);
});
const getAllDeseaseIntoDB = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield desease_model_1.Desease.find();
});
const updateDeseaseIntoDB = (id, paylaod) => __awaiter(void 0, void 0, void 0, function* () {
    return yield desease_model_1.Desease.findByIdAndUpdate(id, paylaod, { new: true });
});
const deleteDeseaseIntoDB = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield desease_model_1.Desease.findByIdAndDelete(id);
});
exports.deseaseServices = {
    createDeseaseIntoDB,
    getAllDeseaseIntoDB,
    updateDeseaseIntoDB,
    deleteDeseaseIntoDB,
};
