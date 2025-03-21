import { BedControllers } from "./bed.controller";
import { Router } from "express";

const router = Router();

router.get("/", BedControllers.getAllBeds);
router.get("/:id", BedControllers.getSingleBed);
router.post("/", BedControllers.createBed);
router.put("/:id", BedControllers.updateBed);
router.delete("/:id", BedControllers.deleteBed);

export const BedRoutes = router;
