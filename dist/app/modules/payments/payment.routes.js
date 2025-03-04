"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentRoutes = void 0;
const express_1 = require("express");
const payment_controller_1 = require("./payment.controller");
const router = (0, express_1.Router)();
router.get("/", payment_controller_1.PaymentControllers.getAllPaymentInfo);
router.patch("/:regno", payment_controller_1.PaymentControllers.updatePaymentInfo);
exports.PaymentRoutes = router;
