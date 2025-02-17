import { Router } from "express";
import { AdmissionControllers } from "./admission.controller";

const router = Router();

router.post("/", AdmissionControllers.createAdmission);
router.get("/:id", AdmissionControllers.getAdmissionInfo);
router.patch("/:id", AdmissionControllers.updteAdmisison);
router.delete("/:id", AdmissionControllers.deleteAdmission);

export const AdmissionRoutes = router;
