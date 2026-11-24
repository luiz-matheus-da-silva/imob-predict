
import { predictPrice } from "../../js/neural-network/prediction.js";

import {
    loadModel,
    getTrainingContext
} from "./model-storage.js";


// ============================================================
// SERVIÇO DE PREVISÃO
// ============================================================

export async function evaluateProperty(property) {
    // Recupera o modelo treinado.
    const model = await loadModel();

    // Recupera o contexto utilizado no treinamento.
    const trainingContext = getTrainingContext();

    // Executa a previsão.
    const predictedPrice = await predictPrice(
        model,
        property,
        trainingContext
    );

    return {
        predictedPrice,
        modelVersion: "imobpredict-1.0.0"
    };
}
