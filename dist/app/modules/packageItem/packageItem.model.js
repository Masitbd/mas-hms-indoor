"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackageItem = void 0;
const mongoose_1 = require("mongoose");
const packageItemSchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
});
exports.PackageItem = (0, mongoose_1.model)("PackageItem", packageItemSchema);
