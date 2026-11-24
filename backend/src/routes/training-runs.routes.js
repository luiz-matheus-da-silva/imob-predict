
import { Router } from "express";

import {
    getAll,
    getById,
    create,
    complete,
    fail
} from "../controllers/training-runs.controller.js";

const router = Router();

// Listar todos os treinamentos.
router.get("/", getAll);

// Buscar um treinamento pelo ID.
router.get("/:id", getById);

// Registrar o início de um treinamento.
router.post("/", create);

// Finalizar treinamento com sucesso.
router.patch("/:id/complete", complete);

// Registrar falha no treinamento.
router.patch("/:id/fail", fail);

export default router;
