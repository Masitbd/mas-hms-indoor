import { BedControllers } from "./bed.controller";
import { Router } from "express";

const router = Router();

router.get("/", BedControllers.getAllBeds);
router.get("/for-admin", BedControllers.getAllBedsForAdmin);
router.post("/", BedControllers.createBed);
router.patch("/:id", BedControllers.updateBed);
router.delete("/:id", BedControllers.deleteBed);

export const BedRoutes = router;
