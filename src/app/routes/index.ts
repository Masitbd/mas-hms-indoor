import { Router } from "express";
import { BedRoutes } from "../modules/beds/bed.routes";
import { AdmissionRoutes } from "../modules/admission/admission.routes";
import { PaymentRoutes } from "../modules/payments/payment.routes";

const router = Router();

const modules = [
  { path: "/beds", module: BedRoutes },
  { path: "/admission", module: AdmissionRoutes },
  { path: "/payments", module: PaymentRoutes },
];

modules.forEach((route) => {
  router.use(route.path, route.module);
});

export default router;
