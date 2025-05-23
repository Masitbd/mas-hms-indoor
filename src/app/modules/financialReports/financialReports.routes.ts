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
router.get(
  "/hospital-bill-summery/:id",
  financialReportsControllers.getPatientHospitalBillSummery
);
router.get(
  "/hospital-bill-details/:id",
  financialReportsControllers.getPatientHospitalBillDetails
);
router.get(
  "/doctor-bills/:id",
  financialReportsControllers.getPatientDoctorBills
);

export const financialRoutes = router;
