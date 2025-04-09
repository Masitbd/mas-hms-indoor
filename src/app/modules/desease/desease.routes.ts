import { Router } from "express";
import { deseaseController } from "./desease.controller";

const router = Router();

router.post("/", deseaseController.createDesease);
router.get("/", deseaseController.getAllDesease);
router.patch("/:id", deseaseController.updateDesease);
router.delete("/:id", deseaseController.deleteDesease);

export const DeseaseRoutes = router;
