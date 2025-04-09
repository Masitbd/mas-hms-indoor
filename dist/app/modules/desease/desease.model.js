"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Desease = void 0;
const mongoose_1 = require("mongoose");
const deseaseSchema = new mongoose_1.Schema({
    name: { type: String, unique: true, required: true },
});
exports.Desease = (0, mongoose_1.model)("Desease", deseaseSchema);
