import { Router } from "express";
import { worldControllers } from "./world.controller";

const router = Router();

router.get("/", worldControllers.getAllWorld);
router.get("/:id", worldControllers.getSingleWorld);
router.post("/", worldControllers.createWorld);
router.patch("/:id", worldControllers.updateWorld);
router.delete("/:id", worldControllers.deleteWorld);

export const WorldRoutes = router;
