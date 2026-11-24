
import { database } from "../config/database.js";

// =====================================================
// LISTAR TODAS AS VERSÕES DOS MODELOS
// =====================================================

export async function getAll(request, response) {
    try {
        const query = `
            SELECT *
            FROM model_versions
            ORDER BY created_at DESC;
        `;

        const result = await database.query(query);

        return response.status(200).json(result.rows);

    } catch (error) {
        console.error("Erro ao listar versões:", error);

        return response.status(500).json({
            message: "Erro ao listar versões dos modelos."
        });
    }
}


// =====================================================
// BUSCAR UMA VERSÃO PELO ID
// =====================================================

export async function getById(request, response) {
    try {
        const { id } = request.params;

        if (!/^[1-9]\d*$/.test(id)) {
            return response.status(400).json({
                message: "Identificador inválido."
            });
        }

        const query = `
            SELECT *
            FROM model_versions
            WHERE id = $1;
        `;

        const result = await database.query(query, [id]);

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Versão do modelo não encontrada."
            });
        }

        return response.status(200).json(result.rows[0]);

    } catch (error) {
        console.error("Erro ao buscar versão:", error);

        return response.status(500).json({
            message: "Erro ao buscar versão do modelo."
        });
    }
}


// =====================================================
// CADASTRAR UMA NOVA VERSÃO
// =====================================================

export async function create(request, response) {
    const {
        version,
        mae,
        mse,
        loss,
        trainingSamples,
        isActive
    } = request.body;

    if (
        typeof version !== "string" ||
        !version.trim() ||
        !Number.isInteger(trainingSamples) ||
        trainingSamples <= 0 ||
        (isActive !== undefined && typeof isActive !== "boolean")
    ) {
        return response.status(400).json({
            message: "Dados obrigatórios ou inválidos."
        });
    }

    const metrics = [mae, mse, loss];

    if (
        metrics.some(
            value => value !== null &&
                value !== undefined &&
                (typeof value !== "number" || !Number.isFinite(value) || value < 0)
        )
    ) {
        return response.status(400).json({
            message: "As métricas devem ser números não negativos."
        });
    }

    const client = await database.connect();

    try {
        await client.query("BEGIN");

        // Desativa a versão anterior quando a nova será ativa.
        if (isActive === true) {
            await client.query(`
                UPDATE model_versions
                SET is_active = FALSE
                WHERE is_active = TRUE;
            `);
        }

        const query = `
            INSERT INTO model_versions (
                version,
                mae,
                mse,
                loss,
                training_samples,
                is_active
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;

        const values = [
            version.trim(),
            mae ?? null,
            mse ?? null,
            loss ?? null,
            trainingSamples,
            isActive ?? false
        ];

        const result = await client.query(query, values);

        await client.query("COMMIT");

        return response.status(201).json({
            message: "Versão do modelo cadastrada com sucesso.",
            modelVersion: result.rows[0]
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Erro ao cadastrar versão:", error);

        if (error.code === "23505") {
            return response.status(409).json({
                message: "Essa versão já está cadastrada."
            });
        }

        return response.status(500).json({
            message: "Erro ao cadastrar versão do modelo."
        });

    } finally {
        client.release();
    }
}
