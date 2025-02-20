import { Server } from "http";

import app from "./app";
import { config } from "./app/config";
import mongoose from "mongoose";

const port = config.port;

async function main() {
  await mongoose.connect(config.database_url as string);
  console.log("db connnection established");

  const server: Server = app.listen(port, () => {
    console.log(`Server is listening on port http://localhost:${port}`);
  });
}

main();
