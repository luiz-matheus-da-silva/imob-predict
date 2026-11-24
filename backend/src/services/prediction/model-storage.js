
import * as tf from "@tensorflow/tfjs";

// Identificador utilizado pelo TensorFlow.js no IndexedDB.
const MODEL_URL = "indexeddb://imobpredict-model";

// Chave utilizada para armazenar o contexto de treinamento.
const CONTEXT_KEY = "imobpredict-training-context";

// Mantém o modelo carregado em memória.
let loadedModel = null;


// ============================================================
// CARREGAMENTO DO MODELO
// ============================================================

export async function loadModel() {
    if (loadedModel) {
        return loadedModel;
    }

    loadedModel = await tf.loadLayersModel(MODEL_URL);

    return loadedModel;
}


// ============================================================
// ARMAZENAMENTO DO CONTEXTO
// ============================================================

export function saveTrainingContext(trainingContext) {
    localStorage.setItem(
        CONTEXT_KEY,
        JSON.stringify(trainingContext)
    );
}


// ============================================================
// RECUPERAÇÃO DO CONTEXTO
// ============================================================

export function getTrainingContext() {
    const savedContext = localStorage.getItem(CONTEXT_KEY);

    if (!savedContext) {
        throw new Error(
            "Contexto de treinamento não encontrado."
        );
    }

    return JSON.parse(savedContext);
}


// ============================================================
// VERIFICAÇÃO DO MODELO
// ============================================================

export async function hasTrainedModel() {
    try {
        const model = await loadModel();

        return Boolean(model);

    } catch {
        return false;
    }
}


// ============================================================
// LIBERAÇÃO DO MODELO
// ============================================================

export function disposeModel() {
    if (loadedModel) {
        loadedModel.dispose();
        loadedModel = null;
    }
}
