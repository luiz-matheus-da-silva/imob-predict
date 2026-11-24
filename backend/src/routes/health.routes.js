
import { Router } from "express";

import { database } from "../config/database.js";

const router = Router();

/**
 * GET /api/health
 *
 * Verifica se a API está funcionando
 * e se consegue consultar o PostgreSQL.
 */
router.get("/", async (request, response) => {

    try {

        // Executa uma consulta simples no PostgreSQL.
        const result = await database.query(
            "SELECT NOW() AS database_time"
        );

        return response.status(200).json({
            status: "healthy",
            message: "API e banco de dados funcionando.",
            database: {
                connected: true,
                time: result.rows[0].database_time
            }
        });

    } catch (error) {

        console.error("Erro ao verificar o banco:", error);

        return response.status(503).json({
            status: "unavailable",
            message: "Não foi possível conectar ao banco de dados."
        });

    }

});

export default router;
