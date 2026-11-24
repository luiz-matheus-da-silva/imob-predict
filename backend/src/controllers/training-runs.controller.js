
import { database } from "../config/database.js";

// =====================================================
// LISTAR HISTÓRICO DE TREINAMENTOS
// =====================================================

export async function getAll(request, response) {
    try {
        const query = `
            SELECT
                training_runs.*,
                model_versions.version AS model_version
            FROM training_runs
            LEFT JOIN model_versions
                ON training_runs.model_version_id = model_versions.id
            ORDER BY training_runs.created_at DESC;
        `;

        const result = await database.query(query);

        return response.status(200).json(result.rows);

    } catch (error) {
        console.error("Erro ao listar treinamentos:", error);

        return response.status(500).json({
            message: "Erro ao listar histórico de treinamentos."
        });
    }
}


// =====================================================
// BUSCAR UM TREINAMENTO PELO ID
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
                training_runs.*,
                model_versions.version AS model_version
            FROM training_runs
            LEFT JOIN model_versions
                ON training_runs.model_version_id = model_versions.id
            WHERE training_runs.id = $1;
        `;

        const result = await database.query(query, [id]);

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Treinamento não encontrado."
            });
        }

        return response.status(200).json(result.rows[0]);

    } catch (error) {
        console.error("Erro ao buscar treinamento:", error);

        return response.status(500).json({
            message: "Erro ao buscar treinamento."
        });
    }
}


// =====================================================
// REGISTRAR INÍCIO DE TREINAMENTO
// =====================================================

export async function create(request, response) {
    try {
        const {
            epochs,
            trainingSamples,
            validationSamples,
            testSamples
        } = request.body;

        const sampleCounts = [
            trainingSamples,
            validationSamples,
            testSamples
        ];

        if (
            !Number.isInteger(epochs) ||
            epochs <= 0 ||
            sampleCounts.some(
                value => !Number.isInteger(value) || value < 0
            ) ||
            sampleCounts.some(value => value === 0)
        ) {
            return response.status(400).json({
                message: "Dados de treinamento inválidos."
            });
        }

        const query = `
            INSERT INTO training_runs (
                status,
                epochs,
                training_samples,
                validation_samples,
                test_samples,
                started_at
            )
            VALUES ('running', $1, $2, $3, $4, NOW())
            RETURNING *;
        `;

        const values = [
            epochs,
            trainingSamples,
            validationSamples,
            testSamples
        ];

        const result = await database.query(query, values);

        return response.status(201).json({
            message: "Treinamento registrado com sucesso.",
            trainingRun: result.rows[0]
        });

    } catch (error) {
        console.error("Erro ao registrar treinamento:", error);

        return response.status(500).json({
            message: "Erro ao registrar início do treinamento."
        });
    }
}


// =====================================================
// FINALIZAR TREINAMENTO COM SUCESSO
// =====================================================

export async function complete(request, response) {
    const { id } = request.params;

    if (!/^[1-9]\d*$/.test(id)) {
        return response.status(400).json({
            message: "Identificador inválido."
        });
    }

    const {
        version,
        epochs,
        mae,
        mse,
        loss,
        trainingSamples,
        validationSamples,
        testSamples
    } = request.body;

    const metrics = [mae, mse, loss];

    const sampleCounts = [
        trainingSamples,
        validationSamples,
        testSamples
    ];

    if (
        typeof version !== "string" ||
        !version.trim() ||
        !Number.isInteger(epochs) ||
        epochs <= 0 ||
        sampleCounts.some(
            value => !Number.isInteger(value) || value <= 0
        ) ||
        metrics.some(
            value =>
                typeof value !== "number" ||
                !Number.isFinite(value) ||
                value < 0
        )
    ) {
        return response.status(400).json({
            message: "Dados de conclusão inválidos."
        });
    }

    const client = await database.connect();

    try {
        await client.query("BEGIN");

        // Verifica se o treinamento existe e ainda está em execução.
        const trainingResult = await client.query(
            `
                SELECT *
                FROM training_runs
                WHERE id = $1
                FOR UPDATE;
            `,
            [id]
        );

        if (trainingResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return response.status(404).json({
                message: "Treinamento não encontrado."
            });
        }

        const trainingRun = trainingResult.rows[0];

        if (trainingRun.status !== "running") {
            await client.query("ROLLBACK");

            return response.status(409).json({
                message: "Este treinamento já foi finalizado."
            });
        }

        // Desativa a versão anteriormente ativa.
        await client.query(`
            UPDATE model_versions
            SET is_active = FALSE
            WHERE is_active = TRUE;
        `);

        // Cadastra a nova versão do modelo.
        const modelResult = await client.query(
            `
                INSERT INTO model_versions (
                    version,
                    mae,
                    mse,
                    loss,
                    training_samples,
                    is_active
                )
                VALUES ($1, $2, $3, $4, $5, TRUE)
                RETURNING *;
            `,
            [
                version.trim(),
                mae,
                mse,
                loss,
                trainingSamples
            ]
        );

        const modelVersion = modelResult.rows[0];

        // Atualiza o histórico do treinamento.
        const updateResult = await client.query(
            `
                UPDATE training_runs
                SET
                    model_version_id = $1,
                    status = 'completed',
                    epochs = $2,
                    mae = $3,
                    mse = $4,
                    loss = $5,
                    training_samples = $6,
                    validation_samples = $7,
                    test_samples = $8,
                    completed_at = NOW()
                WHERE id = $9
                RETURNING *;
            `,
            [
                modelVersion.id,
                epochs,
                mae,
                mse,
                loss,
                trainingSamples,
                validationSamples,
                testSamples,
                id
            ]
        );

        await client.query("COMMIT");

        return response.status(200).json({
            message: "Treinamento finalizado e versão do modelo cadastrada.",
            trainingRun: updateResult.rows[0],
            modelVersion
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Erro ao finalizar treinamento:", error);

        if (error.code === "23505") {
            return response.status(409).json({
                message: "Essa versão do modelo já está cadastrada."
            });
        }

        return response.status(500).json({
            message: "Erro ao finalizar treinamento."
        });

    } finally {
        client.release();
    }
}


// =====================================================
// REGISTRAR FALHA NO TREINAMENTO
// =====================================================

export async function fail(request, response) {
    try {
        const { id } = request.params;
        const { errorMessage } = request.body;

        if (!/^[1-9]\d*$/.test(id)) {
            return response.status(400).json({
                message: "Identificador inválido."
            });
        }

        if (
            typeof errorMessage !== "string" ||
            !errorMessage.trim()
        ) {
            return response.status(400).json({
                message: "A descrição do erro é obrigatória."
            });
        }

        const query = `
            UPDATE training_runs
            SET
                status = 'failed',
                error_message = $1,
                completed_at = NOW()
            WHERE id = $2
                AND status = 'running'
            RETURNING *;
        `;

        const result = await database.query(
            query,
            [errorMessage.trim(), id]
        );

        if (result.rows.length === 0) {
            return response.status(404).json({
                message: "Treinamento não encontrado ou já finalizado."
            });
        }

        return response.status(200).json({
            message: "Falha do treinamento registrada.",
            trainingRun: result.rows[0]
        });

    } catch (error) {
        console.error("Erro ao registrar falha:", error);

        return response.status(500).json({
            message: "Erro ao registrar falha do treinamento."
        });
    }
}
