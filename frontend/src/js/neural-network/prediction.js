
import * as tf from "@tensorflow/tfjs";

import { encodePropertyFeatures } from "./encoding.js";

/**
 * Desnormaliza o preço previsto pela rede neural.
 *
 * Converte o resultado entre 0 e 1
 * novamente para a escala monetária original.
 */
function denormalizePrice(value, minimum, maximum) {
    return value * (maximum - minimum) + minimum;
}

/**
 * Realiza a previsão do preço de um imóvel.
 *
 * @param {tf.LayersModel} model - Modelo treinado.
 * @param {Object} property - Características do imóvel.
 * @param {Object} trainingContext - Contexto do treinamento.
 */
export async function predictPrice(
    model,
    property,
    trainingContext
) {
    // Prepara as características de entrada.
    const features = encodePropertyFeatures(
        property,
        trainingContext
    );

    // Converte as características em tensor.
    const inputTensor = tf.tensor2d([features]);

    let predictionTensor;

    try {
        // Executa a previsão.
        predictionTensor = model.predict(inputTensor);

        // Obtém o resultado numérico.
        const predictionValues = await predictionTensor.data();

        // Recupera os limites originais do preço.
        const priceLimits = trainingContext.numericLimits.price;

        // Retorna o preço na escala original.
        return denormalizePrice(
            predictionValues[0],
            priceLimits.min,
            priceLimits.max
        );

    } finally {
        // Libera os tensores da memória.
        inputTensor.dispose();
        predictionTensor?.dispose();
    }
}
