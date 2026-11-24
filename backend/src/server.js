
import "dotenv/config";

import express from "express";
import cors from "cors";

import { database } from "./config/database.js";
import healthRoutes from "./routes/health.routes.js";
import propertyRoutes from "./routes/property.routes.js";
import modelVersionRoutes from "./routes/model-version.routes.js";
import evaluationRoutes from "./routes/evaluation.routes.js";

const app = express();

// Permite receber requisições do frontend React.
app.use(cors({
    origin: "http://localhost:5173"
}));

// Permite interpretar requisições com JSON.
app.use(express.json());

// Rota de verificação da aplicação.
app.use("/api/health", healthRoutes);
app.use("/api/properties", propertyRoutes);
app.use("/api/evaluations", evaluationRoutes);
    
// =====================================================
// TRATAMENTO GLOBAL DE ERROS
// =====================================================

app.use((error, request, response, next) => {
    console.error("Erro na aplicação:", error);

    const statusCode = error.statusCode || 500;

    return response.status(statusCode).json({
        message:
            statusCode === 500
                ? "Erro interno do servidor."
                : error.message
    });
});

app.use("/api/model-versions", modelVersionRoutes);

const PORT = process.env.PORT || 3000;

/**
 * Inicializa o servidor somente depois
 * de confirmar a conexão com o PostgreSQL.
 */
async function startServer() {

    try {

        await database.query("SELECT 1");

        console.log("Conexão com PostgreSQL estabelecida.");

        app.listen(PORT, () => {
            console.log(`Servidor iniciado na porta ${PORT}.`);
            console.log(`http://localhost:${PORT}`);
        });

    } catch (error) {

        console.error("Não foi possível iniciar a aplicação:");
        console.error(error.message);

        process.exit(1);

    }

}

startServer();
