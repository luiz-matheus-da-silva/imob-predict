
import {
    saveTrainingContext,
    saveModelInfo,
    loadModelInfo
} from "./model-storage.js";

const API_URL = "http://localhost:3000/api";

// ============================================================
// COMUNICAÇÃO COM A API
// ============================================================

async function apiRequest(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json"
        },
        ...options
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(
            data.message || "Erro ao comunicar com a API."
        );
    }

    return data;
}


// ============================================================
// CRIAR REGISTRO DO TREINAMENTO
// ============================================================

async function createTrainingRun(trainingData) {
    const response = await apiRequest("/training-runs", {
        method: "POST",
        body: JSON.stringify(trainingData)
    });

    return response.trainingRun ?? response;
}


// ============================================================
// FINALIZAR TREINAMENTO
// ============================================================

async function completeTrainingRun(trainingRunId, result) {
    return apiRequest(
        `/training-runs/${trainingRunId}/complete`,
        {
            method: "PATCH",
            body: JSON.stringify(result)
        }
    );
}


// ============================================================
// REGISTRAR FALHA
// ============================================================

async function failTrainingRun(trainingRunId, errorMessage) {
    return apiRequest(
        `/training-runs/${trainingRunId}/fail`,
        {
            method: "PATCH",
            body: JSON.stringify({ errorMessage })
        }
    );
}


// ============================================================
// CRIAR WORKER
// ============================================================

export function createTrainingWorker({
    onMessage,
    onError
} = {}) {
    const worker = new Worker(
        new URL("../../js/workers/training.worker.js", import.meta.url),
        { type: "module" }
    );

    let trainingRunId = null;
    let started = false;
    let finished = false;
    let processing = false;

    async function handleMessage(event) {
        const data = event.data;

        try {
            // ------------------------------------------------
            // WORKER PREPAROU OS DADOS
            // ------------------------------------------------

            if (data.type === "training-ready") {
                if (processing) return;

                processing = true;

                try {
                    // Cria o histórico antes do treinamento.
                    const trainingRun = await createTrainingRun({
                        epochs: data.epochs,
                        trainingSamples: data.trainingSamples,
                        validationSamples: data.validationSamples,
                        testSamples: data.testSamples
                    });

                    trainingRunId = trainingRun.id;

                    if (!trainingRunId) {
                        throw new Error(
                            "A API não retornou o ID do treinamento."
                        );
                    }

                    onMessage?.({
                        type: "training-registered",
                        trainingRun
                    });

                    // Autoriza o Worker a começar.
                    worker.postMessage({
                        type: "training-authorized"
                    });

                } catch (error) {
                    worker.postMessage({
                        type: "training-cancelled"
                    });

                    throw error;
                } finally {
                    processing = false;
                }

                return;
            }

            // ------------------------------------------------
            // TREINAMENTO CONCLUÍDO
            // ------------------------------------------------

            if (data.type === "training-finished") {
                if (!trainingRunId) {
                    throw new Error(
                        "Registro do treinamento não encontrado."
                    );
                }

                // Persiste o contexto de treinamento.
                saveTrainingContext(data.trainingContext);
                saveModelInfo({
                    metrics: data.metrics,
                    trainingSamples: data.trainingSamples,
                    trainedAt: data.modelInfo?.dateSaved ?? new Date().toISOString()
                });

                const response = await completeTrainingRun(
                    trainingRunId,
                    {
                        version: `imobpredict-${Date.now()}`,
                        epochs: data.epochs,
                        mae: data.metrics.mae,
                        mse: data.metrics.mse,
                        loss: data.metrics.loss,
                        trainingSamples: data.trainingSamples,
                        validationSamples: data.validationSamples,
                        testSamples: data.testSamples
                    }
                );

                // Guarda a versão cadastrada no banco para vincular as
                // próximas avaliações a este modelo.
                saveModelInfo({
                    ...loadModelInfo(),
                    modelVersionId: response.modelVersion?.id,
                    version: response.modelVersion?.version
                });

                finished = true;

                onMessage?.({
                    ...data,
                    type: "training-finished",
                    trainingRun: response.trainingRun,
                    modelVersion: response.modelVersion
                });

                worker.terminate();
                return;
            }

            // ------------------------------------------------
            // TREINAMENTO COM ERRO
            // ------------------------------------------------

            if (data.type === "training-error") {
                if (trainingRunId) {
                    await failTrainingRun(
                        trainingRunId,
                        data.message
                    );
                }

                finished = true;

                onMessage?.(data);

                worker.terminate();
                return;
            }

            // Encaminha logs e demais mensagens.
            onMessage?.(data);

        } catch (error) {
            finished = true;

            if (trainingRunId) {
                try {
                    await failTrainingRun(
                        trainingRunId,
                        error.message
                    );
                } catch (failureError) {
                    console.error(
                        "Erro ao registrar falha do treinamento:",
                        failureError
                    );
                }
            }

            onError?.(error);
            worker.terminate();
        }
    }

    worker.addEventListener("message", handleMessage);

    worker.addEventListener("error", async event => {
        if (trainingRunId) {
            try {
                await failTrainingRun(
                    trainingRunId,
                    event.message || "Erro inesperado no Worker."
                );
            } catch (error) {
                console.error(error);
            }
        }

        finished = true;

        onError?.(
            new Error(
                event.message || "Erro inesperado no Worker."
            )
        );

        worker.terminate();
    });

    return {
        start() {
            if (started || finished) {
                throw new Error(
                    "Este Worker já foi iniciado ou finalizado."
                );
            }

            started = true;

            worker.postMessage({
                type: "start-training"
            });
        },

        terminate() {
            if (finished) return;

            finished = true;
            worker.terminate();
        }
    };
}
