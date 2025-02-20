import dotenv from "dotenv";

dotenv.config();

export const config = {
  node_module: process.env.NODE_MODULE,
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
};
