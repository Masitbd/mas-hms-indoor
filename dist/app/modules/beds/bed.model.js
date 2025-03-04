"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bed = void 0;
const mongoose_1 = require("mongoose");
const bedSchema = new mongoose_1.Schema({
    bedName: { type: String, required: true, unique: true },
    isAllocated: { type: Boolean, default: false },
    phone: { type: String },
    floor: { type: String },
    worldId: { type: mongoose_1.Schema.Types.ObjectId, ref: "BedWorld" },
}, {
    timestamps: true,
});
exports.Bed = (0, mongoose_1.model)("Bed", bedSchema);
