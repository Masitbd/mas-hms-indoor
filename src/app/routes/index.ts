import { Router } from "express";

import { AdmissionRoutes } from "../modules/admission/admission.routes";
import { PaymentRoutes } from "../modules/payments/payment.routes";
import { WorldRoutes } from "../modules/bedWorld/world.routes";
import { BedRoutes } from "../modules/beds/bed.routes";
import { packageRoutes } from "../modules/packageItem/packageItem.routes";
import { DeseaseRoutes } from "../modules/desease/desease.routes";
import { financialRoutes } from "../modules/financialReports/financialReports.routes";

const router = Router();

const modules = [
  { path: "/worlds", module: WorldRoutes },
  { path: "/beds", module: BedRoutes },
  { path: "/admission", module: AdmissionRoutes },
  { path: "/payments", module: PaymentRoutes },
  { path: "/packages", module: packageRoutes },
  { path: "/desease", module: DeseaseRoutes },
  { path: "/indoor-finance", module: financialRoutes },
];

modules.forEach((route) => {
  router.use(route.path, route.module);
});

export default router;
