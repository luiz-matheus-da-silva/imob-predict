
import { saveTrainingContext } from "./model-storage.js";

/**
 * Cria e controla o Worker responsável pelo treinamento.
 *
 * @param {Object} callbacks
 * @param {Function} callbacks.onMessage
 * @param {Function} callbacks.onError
 */
export function createTrainingWorker({ onMessage, onError } = {}) {
  const worker = new Worker(
    new URL("../../js/workers/training.worker.js", import.meta.url),
    { type: "module" }
  );

  let finished = false;

  worker.addEventListener("message", async (event) => {
    const data = event.data;

    try {
      // Quando o treinamento termina, persistimos o contexto
      // necessário para normalizar futuras avaliações.
      if (data.type === "training-finished") {
        saveTrainingContext(data.trainingContext);
        finished = true;
      }

      onMessage?.(data);

      // Encerra o Worker após o resultado final.
      if (
        data.type === "training-finished" ||
        data.type === "training-error"
      ) {
        worker.terminate();
      }
    } catch (error) {
      onError?.(error);
      worker.terminate();
    }
  });

  worker.addEventListener("error", (event) => {
    onError?.(new Error(event.message || "Erro inesperado no Worker."));
    worker.terminate();
  });

  return {
    start() {
      if (finished) {
        throw new Error("Este Worker já finalizou o treinamento.");
      }

      worker.postMessage({ type: "start-training" });
    },

    terminate() {
      worker.terminate();
    }
  };
}
