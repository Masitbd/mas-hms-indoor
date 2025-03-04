"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Service = void 0;
const mongoose_1 = require("mongoose");
const serviceSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    rate: { type: Number, required: true },
    vat: { type: Number, required: true },
    isFixed: { type: Boolean, required: true, default: false },
    fixedRate: { type: Number, required: true, default: 0 },
    status: {
        type: String,
        required: true,
        enum: ["active", "inactive"],
        default: "active",
    },
}, {
    timestamps: true,
});
exports.Service = (0, mongoose_1.model)("Service", serviceSchema);
