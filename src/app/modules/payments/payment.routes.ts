import { Router } from "express";
import { PaymentControllers } from "./payment.controller";

const router = Router();

router.get("/", PaymentControllers.getAllPaymentInfo);
router.patch("/:regno", PaymentControllers.updatePaymentInfo);

export const PaymentRoutes = router;
