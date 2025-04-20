"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpService = exports.AccountService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../app/config");
const HttpService = (baseUrl) => {
    // console.log(baseUrl, 'basse');
    const instance = axios_1.default.create({
        baseURL: baseUrl,
        timeout: 6000000,
        headers: {
            "Content-Type": "application/json",
        },
    });
    instance.interceptors.request.use((config) => {
        return config;
    }, (error) => {
        return error;
    });
    instance.interceptors.response.use((response) => {
        return response.data;
    }, (error) => {
        return Promise.reject(error);
    });
    return instance;
};
exports.HttpService = HttpService;
const AccountService = HttpService(config_1.config.accountServiceUrl);
exports.AccountService = AccountService;
