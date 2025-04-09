import { Router } from "express";
import { packageController } from "./packageItem.controller";

const router = Router();

router.post("/", packageController.createPackage);
router.get("/", packageController.getAllPackage);
router.patch("/:id", packageController.updatePackage);
router.delete("/:id", packageController.deletePackage);

export const packageRoutes = router;
