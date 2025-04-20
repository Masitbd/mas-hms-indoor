"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    node_module: process.env.NODE_MODULE,
    port: process.env.PORT,
    database_url: process.env.DATABASE_URL,
    accountServiceUrl: process.env.ACCOUNT_SERVICE_URL,
};
