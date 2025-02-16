import { Router } from "express";
import { BedRoutes } from "../modules/beds/bed.routes";

const router = Router();

const modules = [{ path: "/beds", module: BedRoutes }];

modules.forEach((route) => {
  router.use(route.path, route.module);
});

export default router;
