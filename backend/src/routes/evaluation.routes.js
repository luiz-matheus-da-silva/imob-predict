
import { Router } from "express";

import * as evaluationController from "../controllers/evaluation.controller.js";

const router = Router();

// Estatísticas do dashboard.
router.get("/statistics", evaluationController.getStatistics);

// Lista todas as avaliações.
router.get("/", evaluationController.getAll);

// Busca uma avaliação pelo ID.
router.get("/:id", evaluationController.getById);

// Registra uma nova avaliação.
router.post("/", evaluationController.create);

export default router;
