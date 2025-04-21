"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admission_routes_1 = require("../modules/admission/admission.routes");
const payment_routes_1 = require("../modules/payments/payment.routes");
const world_routes_1 = require("../modules/bedWorld/world.routes");
const bed_routes_1 = require("../modules/beds/bed.routes");
const packageItem_routes_1 = require("../modules/packageItem/packageItem.routes");
const desease_routes_1 = require("../modules/desease/desease.routes");
const financialReports_routes_1 = require("../modules/financialReports/financialReports.routes");
const router = (0, express_1.Router)();
const modules = [
    { path: "/worlds", module: world_routes_1.WorldRoutes },
    { path: "/beds", module: bed_routes_1.BedRoutes },
    { path: "/admission", module: admission_routes_1.AdmissionRoutes },
    { path: "/payments", module: payment_routes_1.PaymentRoutes },
    { path: "/packages", module: packageItem_routes_1.packageRoutes },
    { path: "/desease", module: desease_routes_1.DeseaseRoutes },
    { path: "/indoor-finance", module: financialReports_routes_1.financialRoutes },
];
modules.forEach((route) => {
    router.use(route.path, route.module);
});
exports.default = router;
