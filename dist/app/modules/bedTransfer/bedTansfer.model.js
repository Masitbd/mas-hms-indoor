"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferBed = void 0;
const mongoose_1 = require("mongoose");
const bedTransferSchema = new mongoose_1.Schema({
    patientId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Admission",
        required: true,
        index: true,
    },
    transferInfo: [
        {
            previousBed: { type: mongoose_1.Schema.Types.ObjectId, ref: "Bed", required: true },
            newBed: { type: mongoose_1.Schema.Types.ObjectId, ref: "Bed", required: true },
            admissionDate: { type: String, required: true },
            totalAmount: { type: Number, required: true },
            dayStayed: { type: Number, required: true },
        },
    ],
});
exports.TransferBed = (0, mongoose_1.model)("TransferBed", bedTransferSchema);
