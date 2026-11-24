
import { Router } from "express";

import * as modelVersionController from "../controllers/model-version.controller.js";

const router = Router();

// Lista todas as versões.
router.get("/", modelVersionController.getAll);

// Busca uma versão pelo ID.
router.get("/:id", modelVersionController.getById);

// Cadastra uma nova versão.
router.post("/", modelVersionController.create);

export default router;
