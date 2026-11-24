import { MODEL_URL, getModelStatus } from "./prediction.service.js";

function arrayBufferToBase64(buffer) {
    const bytes = new Uint8Array(buffer);
    const chunkSize = 0x8000;
    let binary = "";

    // Em blocos, para não estourar o limite de argumentos da pilha.
    for (let index = 0; index < bytes.length; index += chunkSize) {
        binary += String.fromCharCode(
            ...bytes.subarray(index, index + chunkSize)
        );
    }

    return btoa(binary);
}

function createFileName(date) {
    const pad = (value) => String(value).padStart(2, "0");

    const stamp =
        `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}` +
        `-${pad(date.getHours())}${pad(date.getMinutes())}`;

    return `imobpredict-model-${stamp}.json`;
}

/**
 * Monta o pacote do modelo treinado.
 *
 * Reúne tudo o que é necessário para reutilizar o modelo:
 * topologia, pesos e contexto de normalização (limites e categorias).
 */
export async function exportTrainedModel() {
    const status = await getModelStatus();

    if (!status.ready) {
        throw new Error(
            "Nenhum modelo treinado foi encontrado. Treine o modelo primeiro."
        );
    }

    const tf = await import("@tensorflow/tfjs");
    const model = await tf.loadLayersModel(MODEL_URL);

    try {
        // Captura os artefatos do modelo sem gravá-los em disco.
        let artifacts;

        await model.save(
            tf.io.withSaveHandler(async (modelArtifacts) => {
                artifacts = modelArtifacts;

                return {
                    modelArtifactsInfo: {
                        dateSaved: new Date(),
                        modelTopologyType: "JSON"
                    }
                };
            })
        );

        const exportedAt = new Date();

        return {
            fileName: createFileName(exportedAt),
            content: {
                format: "imobpredict-model",
                version: 1,
                exportedAt: exportedAt.toISOString(),
                trainingContext: status.context,
                modelInfo: status.info,
                modelTopology: artifacts.modelTopology,
                weightSpecs: artifacts.weightSpecs,
                // Pesos em binário, codificados em base64.
                weightData: arrayBufferToBase64(artifacts.weightData)
            }
        };
    } finally {
        model.dispose();
    }
}

/**
 * Gera o pacote do modelo e inicia o download no navegador.
 *
 * @returns {Promise<string>} Nome do arquivo baixado.
 */
export async function downloadTrainedModel() {
    const { fileName, content } = await exportTrainedModel();

    const blob = new Blob([JSON.stringify(content)], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    return fileName;
}
