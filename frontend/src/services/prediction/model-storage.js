const STORAGE_KEY = "imobpredict:training-context";

/**
 * Persiste o contexto do treinamento (limites de normalização,
 * categorias etc.) para ser reutilizado nas próximas avaliações.
 *
 * @param {Object} trainingContext
 */
export function saveTrainingContext(trainingContext) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trainingContext));
}

/**
 * Recupera o contexto salvo, ou `null` se ainda não houver treinamento.
 *
 * @returns {Object|null}
 */
export function loadTrainingContext() {
  const raw = localStorage.getItem(STORAGE_KEY);

  return raw ? JSON.parse(raw) : null;
}

const INFO_KEY = "imobpredict:model-info";

/**
 * Guarda informações do último treinamento (métricas de teste e data),
 * usadas para mostrar a margem de erro típica nas avaliações.
 *
 * As métricas estão na escala normalizada (0 a 1) do preço.
 *
 * @param {{ metrics: Object, trainedAt: string, trainingSamples: number }} info
 */
export function saveModelInfo(info) {
  localStorage.setItem(INFO_KEY, JSON.stringify(info));
}

/**
 * @returns {Object|null}
 */
export function loadModelInfo() {
  const raw = localStorage.getItem(INFO_KEY);

  return raw ? JSON.parse(raw) : null;
}
