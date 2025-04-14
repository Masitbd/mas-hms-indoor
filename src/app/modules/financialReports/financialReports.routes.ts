import { Router } from "express";
import { financialReportsControllers } from "./financialReports.Controller";

const router = Router();

router.get("/", financialReportsControllers.getPaymentBydateAndreceiver);
router.get("/due-collection", financialReportsControllers.getDueStatement);

export const financialRoutes = router;
