import dotenv from "dotenv";

dotenv.config();

export const config = {
  node_module: process.env.NODE_MODULE,
  backend_url: process.env.BACKEND_URL,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  jwt: {
    secret: process.env.JWT_SECRET,
    refresh_secret: process.env.JWT_REFRESH_SECRET,
    expires_in: process.env.JWT_EXPIRES_IN,
    refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  },
  accountServiceUrl: process.env.ACCOUNT_SERVICE_URL,
};
