
import pg from "pg";

const { Pool } = pg;

/**
 * Pool de conexões com o PostgreSQL.
 *
 * O Pool reutiliza conexões, evitando abrir
 * uma nova conexão para cada consulta.
 */
export const database = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,

    // Quantidade máxima de conexões simultâneas.
    max: 10,

    // Tempo máximo para aguardar uma conexão.
    connectionTimeoutMillis: 5000
});

// Registra erros inesperados nas conexões ociosas.
database.on("error", (error) => {
    console.error("Erro inesperado no PostgreSQL:", error);
});
