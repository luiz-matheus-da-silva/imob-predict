import { loadTrainingContext, loadModelInfo } from "./model-storage.js";

export const MODEL_URL = "indexeddb://imobpredict-model";

const NUMERIC_FIELDS = [
    { key: "area", label: "A área", unit: "m²" },
    { key: "bedrooms", label: "O número de quartos" },
    { key: "bathrooms", label: "O número de banheiros" },
    { key: "age", label: "A idade", unit: "anos" },
    { key: "parkingSpaces", label: "O número de vagas" }
];

// O TensorFlow.js é grande: só é carregado quando a avaliação é usada.
async function loadTensorFlow() {
    return import("@tensorflow/tfjs");
}

// Modelo mantido em memória enquanto não houver novo treinamento.
let cachedModel = null;
let cachedModelDate = null;

/**
 * Informa se já existe um modelo treinado pronto para uso.
 *
 * @returns {Promise<{ ready: boolean, context?: Object, info?: Object|null }>}
 */
export async function getModelStatus() {
    const context = loadTrainingContext();

    if (!context) {
        return { ready: false };
    }

    const tf = await loadTensorFlow();
    const savedModels = await tf.io.listModels();

    if (!(MODEL_URL in savedModels)) {
        return { ready: false };
    }

    return {
        ready: true,
        context,
        info: loadModelInfo()
    };
}

async function getModel() {
    const tf = await loadTensorFlow();
    const savedModels = await tf.io.listModels();
    const saved = savedModels[MODEL_URL];

    if (!saved) {
        throw new Error(
            "Nenhum modelo treinado foi encontrado. Treine o modelo primeiro."
        );
    }

    const savedDate = String(saved.dateSaved);

    // Recarrega apenas se o modelo foi treinado novamente.
    if (!cachedModel || cachedModelDate !== savedDate) {
        cachedModel?.dispose();

        cachedModel = await tf.loadLayersModel(MODEL_URL);
        cachedModelDate = savedDate;
    }

    return cachedModel;
}

/**
 * Identifica valores fora da faixa vista no treinamento.
 * Nesses casos a rede extrapola e a estimativa é menos confiável.
 */
function findOutOfRangeWarnings(property, context) {
    const warnings = [];

    for (const { key, label, unit } of NUMERIC_FIELDS) {
        const { min, max } = context.numericLimits[key];
        const value = property[key];

        if (value < min || value > max) {
            const suffix = unit ? ` ${unit}` : "";

            warnings.push(
                `${label} informado (${value}${suffix}) está fora da faixa usada no treinamento (${min} a ${max}${suffix}).`
            );
        }
    }

    const { neighborhoods, conditions } = context.categories;

    if (!neighborhoods.includes(property.neighborhood)) {
        warnings.push(
            `O bairro "${property.neighborhood}" não existe na base de treinamento.`
        );
    }

    if (!conditions.includes(property.condition)) {
        warnings.push(
            `A conservação "${property.condition}" não existe na base de treinamento.`
        );
    }

    return warnings;
}

/**
 * Estima o preço de um imóvel com a rede neural treinada.
 *
 * @param {Object} property
 * @returns {Promise<{
 *   price: number,
 *   range: { low: number, high: number } | null,
 *   warnings: string[]
 * }>}
 */
export async function estimatePrice(property) {
    const context = loadTrainingContext();

    if (!context) {
        throw new Error(
            "O contexto do treinamento não foi encontrado. Treine o modelo novamente."
        );
    }

    const [model, { predictPrice }] = await Promise.all([
        getModel(),
        import("@/js/neural-network/prediction.js")
    ]);

    const rawPrice = await predictPrice(model, property, context);

    if (!Number.isFinite(rawPrice)) {
        throw new Error("O modelo retornou um valor inválido.");
    }

    // A rede pode extrapolar para valores negativos em casos extremos.
    const price = Math.max(0, rawPrice);

    // O MAE de teste está na escala normalizada: converte para reais.
    const info = loadModelInfo();
    const { min, max } = context.numericLimits.price;
    const mae = info?.metrics?.mae;

    const range = Number.isFinite(mae)
        ? {
            low: Math.max(0, price - mae * (max - min)),
            high: price + mae * (max - min)
        }
        : null;

    return {
        price,
        range,
        warnings: findOutOfRangeWarnings(property, context)
    };
}
