"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedWorld = void 0;
const mongoose_1 = require("mongoose");
const bedWorldSchema = new mongoose_1.Schema({
    worldName: { type: String, required: true, unique: true },
    charge: { type: Number, required: true },
    fees: { type: Number, required: true },
}, {
    timestamps: true,
});
exports.BedWorld = (0, mongoose_1.model)("BedWorld", bedWorldSchema);
