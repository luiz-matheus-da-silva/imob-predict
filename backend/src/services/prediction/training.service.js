
import { saveTrainingContext } from "./model-storage.js";

// Mantém uma referência ao Worker ativo.
let trainingWorker = null;

/**
 * Inicia o treinamento da rede neural.
 *
 * @param {Function} onMessage - Recebe as mensagens enviadas pelo Worker.
 * @returns {Function} Função para cancelar o treinamento.
 */
export function startModelTraining(onMessage) {
    // Impede que dois treinamentos sejam iniciados simultaneamente.
    if (trainingWorker) {
        throw new Error("Já existe um treinamento em andamento.");
    }

    // Cria o Worker utilizando a resolução de módulos do Vite.
    const worker = new Worker(
        new URL("../../js/workers/training.worker.js", import.meta.url),
        { type: "module" }
    );

    trainingWorker = worker;

    // Recebe as mensagens enviadas pelo Worker.
    worker.addEventListener("message", (event) => {
        const message = event.data;

        try {
            // Quando o treinamento termina, salva o contexto
            // necessário para normalizar futuras previsões.
            if (message.type === "training-finished") {
                saveTrainingContext(message.trainingContext);
            }

            // Encaminha a mensagem para quem iniciou o treinamento.
            onMessage?.(message);

            // Libera o Worker após o encerramento.
            if (
                message.type === "training-finished" ||
                message.type === "training-error"
            ) {
                worker.terminate();
                trainingWorker = null;
            }
        } catch (error) {
            onMessage?.({
                type: "training-error",
                message: error.message
            });

            worker.terminate();
            trainingWorker = null;
        }
    });

    // Captura erros que aconteçam na execução do próprio Worker.
    worker.addEventListener("error", (event) => {
        onMessage?.({
            type: "training-error",
            message: event.message || "Erro inesperado no Worker."
        });

        worker.terminate();
        trainingWorker = null;
    });

    // Envia a mensagem que inicia o treinamento.
    worker.postMessage({
        type: "start-training"
    });

    // Retorna uma função que permite cancelar o treinamento.
    return function cancelTraining() {
        if (trainingWorker) {
            trainingWorker.terminate();
            trainingWorker = null;
        }
    };
}
