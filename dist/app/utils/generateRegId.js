"use strict";
// let currentId = 0;
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
exports.generateRegId = void 0;
const admission_model_1 = require("../modules/admission/admission.model");
const findLastRegId = () => __awaiter(void 0, void 0, void 0, function* () {
    const lastItem = yield admission_model_1.Admission.findOne({}, {
        regNo: 1,
        _id: 0,
    })
        .sort({
        createdAt: -1,
    })
        .lean();
    return (lastItem === null || lastItem === void 0 ? void 0 : lastItem.regNo) ? lastItem.regNo : undefined;
});
const generateRegId = () => __awaiter(void 0, void 0, void 0, function* () {
    let currentId = "0";
    const lastRegId = yield findLastRegId();
    if (lastRegId) {
        currentId = lastRegId;
    }
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const incrementId = (Number(currentId) + 1).toString().padStart(3, "0");
    return `${year}${month}${incrementId}`;
});
exports.generateRegId = generateRegId;
