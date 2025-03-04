"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admission_routes_1 = require("../modules/admission/admission.routes");
const payment_routes_1 = require("../modules/payments/payment.routes");
const world_routes_1 = require("../modules/bedWorld/world.routes");
const bed_routes_1 = require("../modules/beds/bed.routes");
const router = (0, express_1.Router)();
const modules = [
    { path: "/worlds", module: world_routes_1.WorldRoutes },
    { path: "/beds", module: bed_routes_1.BedRoutes },
    { path: "/admission", module: admission_routes_1.AdmissionRoutes },
    { path: "/payments", module: payment_routes_1.PaymentRoutes },
];
modules.forEach((route) => {
    router.use(route.path, route.module);
});
exports.default = router;
