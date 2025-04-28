import { Router } from "express";
import { PaymentControllers } from "./payment.controller";

const router = Router();

router.get("/", PaymentControllers.getAllPaymentInfo);
router.patch("/:regno", PaymentControllers.updatePaymentInfo);
router.patch("/update/:patientRegNo", PaymentControllers.updatePatientDiscount);

export const PaymentRoutes = router;
