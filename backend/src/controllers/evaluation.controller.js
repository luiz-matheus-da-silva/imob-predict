
import { database } from "../config/database.js";

// =====================================================
// LISTAR TODAS AS AVALIAÇÕES
// =====================================================

export async function getAll(request, response) {
    try {
        const query = `
            SELECT
                e.id,
                e.predicted_price,
                e.created_at,

                p.id AS property_id,
                p.area,
                p.bedrooms,
                p.bathrooms,
                p.age,
                p.parking_spaces,
                p.neighborhood,
                p.condition,
                p.has_pool,

                mv.id AS model_version_id,
                mv.version AS model_version

            FROM evaluations e

            INNER JOIN properties p
                ON p.id = e.property_id

            INNER JOIN model_versions mv
                ON mv.id = e.model_version_id

            ORDER BY e.created_at DESC;
        `;

        const result = await database.query(query);

        return response.status(200).json(result.rows);

    } catch (error) {
        console.error("Erro ao listar avaliações:", error);

        return response.status(500).json({
            message: "Erro ao listar avaliações."
        });
    }
}


// =====================================================
// BUSCAR AVALIAÇÃO PELO ID
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
            SELECT
                e.id,
                e.predicted_price,
                e.created_at,

                p.id AS property_id,
                p.area,
                p.bedrooms,
                p.bathrooms,
                p.age,
                p.parking_spaces,
                p.neighborhood,
                p.condition,
                p.has_pool,

                mv.id AS model_version_id,
                mv.version AS model_version

            FROM evaluations e

            INNER JOIN properties p
                ON p.id = e.property_id

            INNER JOIN model_versions mv
                ON mv.id = e.model_version_id

            WHERE e.id = $1;
        `;

        const result = await database.query(query, [id]);

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Avaliação não encontrada."
            });
        }

        return response.status(200).json(result.rows[0]);

    } catch (error) {
        console.error("Erro ao buscar avaliação:", error);

        return response.status(500).json({
            message: "Erro ao buscar avaliação."
        });
    }
}


// =====================================================
// REGISTRAR UMA AVALIAÇÃO
// =====================================================

export async function create(request, response) {
    try {
        const {
            propertyId,
            modelVersionId,
            predictedPrice
        } = request.body;

        // Valida os identificadores e o preço previsto.
        if (
            !Number.isSafeInteger(propertyId) ||
            propertyId <= 0 ||
            !Number.isSafeInteger(modelVersionId) ||
            modelVersionId <= 0 ||
            typeof predictedPrice !== "number" ||
            !Number.isFinite(predictedPrice) ||
            predictedPrice <= 0
        ) {
            return response.status(400).json({
                message: "Dados da avaliação inválidos."
            });
        }

        const query = `
            INSERT INTO evaluations (
                property_id,
                model_version_id,
                predicted_price
            )
            VALUES ($1, $2, $3)
            RETURNING *;
        `;

        const values = [
            propertyId,
            modelVersionId,
            predictedPrice
        ];

        const result = await database.query(query, values);

        return response.status(201).json({
            message: "Avaliação registrada com sucesso.",
            evaluation: result.rows[0]
        });

    } catch (error) {
        console.error("Erro ao registrar avaliação:", error);

        // Violação de chave estrangeira:
        // imóvel ou versão do modelo inexistente.
        if (error.code === "23503") {
            return response.status(404).json({
                message: "Imóvel ou versão do modelo não encontrada."
            });
        }

        return response.status(500).json({
            message: "Erro ao registrar avaliação."
        });
    }
}


// =====================================================
// ESTATÍSTICAS DAS AVALIAÇÕES
// =====================================================

export async function getStatistics(request, response) {
    try {
        const query = `
            SELECT
                COUNT(*) AS total_evaluations,
                ROUND(AVG(predicted_price), 2) AS average_price,
                MAX(predicted_price) AS highest_price,
                MIN(predicted_price) AS lowest_price

            FROM evaluations;
        `;

        const result = await database.query(query);

        return response.status(200).json(result.rows[0]);

    } catch (error) {
        console.error("Erro ao consultar estatísticas:", error);

        return response.status(500).json({
            message: "Erro ao consultar estatísticas."
        });
    }
}
