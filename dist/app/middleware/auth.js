"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_1 = __importDefault(require("http-status"));
const ApiError_1 = __importDefault(require("../../errors/ApiError"));
const config_1 = require("../config");
const userPermissions_1 = require("../enum/userPermissions");
const jwtHelpers_1 = require("../helper/jwtHelpers");
const auth = (...requiredPermissions) => (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        //get authorization token
        const token = req.headers.authorization;
        if (!token) {
            throw new ApiError_1.default(http_status_1.default.UNAUTHORIZED, "You are not authorized");
        }
        // verify token
        let verifiedUser = null;
        verifiedUser = jwtHelpers_1.jwtHelpers.verifyToken(token, config_1.config.jwt.secret);
        req.user = verifiedUser; // role  , userid
        req.token = token;
        if ((_a = verifiedUser === null || verifiedUser === void 0 ? void 0 : verifiedUser.permissions) === null || _a === void 0 ? void 0 : _a.includes(userPermissions_1.ENUM_USER_PEMISSION.SUPER_ADMIN)) {
            next();
            return;
        }
        if (requiredPermissions &&
            !verifiedUser.permissions.some((permission) => requiredPermissions.includes(permission))) {
            throw new ApiError_1.default(http_status_1.default.FORBIDDEN, "Forbidden");
        }
        next();
    }
    catch (error) {
        next(error);
    }
});
exports.default = auth;
