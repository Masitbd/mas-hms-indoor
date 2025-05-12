import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";

import ApiError from "../../errors/ApiError";

import { config } from "../config";
import { ENUM_USER_PEMISSION } from "../enum/userPermissions";
import { jwtHelpers } from "../helper/jwtHelpers";

const auth =
  (...requiredPermissions: number[]) =>
  async (req: any, res: Response, next: NextFunction) => {
    try {
      //get authorization token

      const token = req.headers.authorization;

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized");
      }
      // verify token
      let verifiedUser = null;

      verifiedUser = jwtHelpers.verifyToken(token, config.jwt.secret as Secret);

      req.user = verifiedUser; // role  , userid
      req.token = token;
      if (
        verifiedUser?.permissions?.includes(ENUM_USER_PEMISSION.SUPER_ADMIN)
      ) {
        next();
        return;
      }
      if (
        requiredPermissions &&
        !verifiedUser.permissions.some((permission: number) =>
          requiredPermissions.includes(permission)
        )
      ) {
        throw new ApiError(httpStatus.FORBIDDEN, "Forbidden");
      }
      next();
    } catch (error) {
      next(error);
    }
  };

export default auth;
