import { Router } from "express";
import { AdmissionControllers } from "./admission.controller";
import auth from "../../middleware/auth";
import { ENUM_USER_PEMISSION } from "../../enum/userPermissions";

const router = Router();

router.post("/", AdmissionControllers.createAdmission);
router.post("/release", AdmissionControllers.releasePatient);
router.get("/", AdmissionControllers.getAllAdmissionInfo);
router.get("/today-admit", AdmissionControllers.getTodayAdmitPatients);
router.get(
  "/admit-overperiod",
  AdmissionControllers.getAdmitPatientsOverAPeriod
);
router.patch("/transfer", AdmissionControllers.transferPatientBed);
router.patch(
  "/add-service",
  auth(ENUM_USER_PEMISSION.MANAGE_ORDER),
  AdmissionControllers.addServicesToPatient
);
router.get("/:id", AdmissionControllers.getAdmissionInfo);
router.patch("/:id", AdmissionControllers.updteAdmisison);
router.delete("/:id", AdmissionControllers.deleteAdmission);

export const AdmissionRoutes = router;
