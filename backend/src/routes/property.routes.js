
import { Router } from "express";

import * as propertyController from "../controllers/property.controller.js";

const router = Router();

router.get("/", propertyController.getAll);

router.get("/:id", propertyController.getById);

router.post("/", propertyController.create);

router.put("/:id", propertyController.update);

router.delete("/:id", propertyController.remove);

export default router;
