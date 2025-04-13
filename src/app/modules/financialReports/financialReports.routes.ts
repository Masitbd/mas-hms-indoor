import { Router } from "express";
import { financialReportsControllers } from "./financialReports.Controller";

const router = Router();

router.get("/", financialReportsControllers.getPaymentBydateAndreceiver);

export const financialRoutes = router;
