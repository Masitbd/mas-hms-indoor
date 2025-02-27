import { Router } from "express";

import { AdmissionRoutes } from "../modules/admission/admission.routes";
import { PaymentRoutes } from "../modules/payments/payment.routes";
import { WorldRoutes } from "../modules/bedWorld/world.routes";
import { BedRoutes } from "../modules/beds/bed.routes";

const router = Router();

const modules = [
  { path: "/worlds", module: WorldRoutes },
  { path: "/beds", module: BedRoutes },
  { path: "/admission", module: AdmissionRoutes },
  { path: "/payments", module: PaymentRoutes },
];

modules.forEach((route) => {
  router.use(route.path, route.module);
});

export default router;
