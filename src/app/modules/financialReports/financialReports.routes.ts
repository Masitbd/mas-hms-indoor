import { Router } from "express";
import { financialReportsControllers } from "./financialReports.Controller";

const router = Router();

router.get("/", financialReportsControllers.getPaymentBydateAndreceiver);
router.get("/due-collection", financialReportsControllers.getDueStatement);
router.get(
  "/due-collection-statement",
  financialReportsControllers.getDueCollectionStatement
);
router.get(
  "/daily-collection-details",
  financialReportsControllers.getDailyCollection
);

export const financialRoutes = router;
