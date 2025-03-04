"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BedRoutes = void 0;
const bed_controller_1 = require("./bed.controller");
const express_1 = require("express");
const router = (0, express_1.Router)();
router.get("/", bed_controller_1.BedControllers.getAllBeds);
router.get("/:id", bed_controller_1.BedControllers.getSingleBed);
router.post("/", bed_controller_1.BedControllers.createBed);
router.put("/:id", bed_controller_1.BedControllers.updateBed);
router.delete("/:id", bed_controller_1.BedControllers.deleteBed);
exports.BedRoutes = router;
