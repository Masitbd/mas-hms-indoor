"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.Admission = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const payment_model_1 = require("../payments/payment.model");
const patientServiceSchema = new mongoose_1.Schema({
    serviceCategory: { type: String },
    allocatedBed: { type: String },
    doctorId: { type: String },
    seriveId: { type: String },
    servicedBy: { type: String },
    amount: { type: Number },
}, {
    _id: false,
    timestamps: true,
});
const admissionSchema = new mongoose_1.Schema({
    regNo: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    gender: {
        type: String,
        enum: ["Male", "Female", "Others"],
        required: true,
    },
    fatherName: { type: String },
    presentAddress: { type: String },
    permanentAddress: { type: String },
    age: { type: String },
    bloodGroup: { type: String },
    status: {
        type: String,
        enum: ["admitted", "released"],
        default: "admitted",
    },
    admissionDate: { type: String },
    admissionTime: { type: String },
    assignDoct: { type: mongoose_1.Schema.Types.ObjectId, ref: "Doctor" },
    refDoct: { type: mongoose_1.Schema.Types.ObjectId, ref: "Doctor" },
    releaseDate: { type: String },
    maritalStatus: {
        type: String,
    },
    occupation: { type: String },
    education: { type: String },
    district: { type: String },
    religion: { type: String },
    residence: { type: String },
    citizenShip: { type: String },
    disease: { type: String },
    isTransfer: { type: Boolean },
    tranferInfo: { type: mongoose_1.Schema.Types.ObjectId },
    firstAdmitDate: { type: String },
    allocatedBed: { type: mongoose_1.default.Types.ObjectId, ref: "Bed" },
    paymentId: { type: mongoose_1.default.Types.ObjectId, ref: "Payment" },
    services: [patientServiceSchema],
    fixedBill: { type: mongoose_1.Schema.Types.ObjectId, ref: "PackageItem" },
}, {
    timestamps: true,
});
admissionSchema.post("save", function () {
    return __awaiter(this, void 0, void 0, function* () {
        const totalAmount = this.services.reduce((acc, service) => acc + (service.amount || 0), 0);
        yield payment_model_1.Payment.findOneAndUpdate({ patientRegNo: this.regNo }, { $set: { totalAmount } });
    });
});
exports.Admission = (0, mongoose_1.model)("Admission", admissionSchema);
