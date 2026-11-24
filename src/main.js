import './style.css';

// ============================================================
// CRIAÇÃO DO WEB WORKER
// ============================================================

// O Worker será responsável por executar o treinamento
// da rede neural em uma thread separada da interface principal.
//
// Isso evita que o treinamento bloqueie a aplicação.

const trainingWorker = new Worker(
    new URL("./js/workers/training.worker.js", import.meta.url),
    {
        type: "module"
    }
);

// ============================================================
// RECEBIMENTO DE MENSAGENS DO WEB WORKER
// ============================================================

// O Worker envia mensagens para informar o andamento
// do treinamento e os resultados da avaliação.

trainingWorker.onmessage = (event) => {

    const data = event.data;

    // --------------------------------------------------------
    // TREINAMENTO INICIADO
    // --------------------------------------------------------

    if (data.type === "training-started") {

        console.log("================================");
        console.log("TREINAMENTO INICIADO");
        console.log("================================");

    }

    // --------------------------------------------------------
    // PROGRESSO DO TREINAMENTO
    // --------------------------------------------------------

    if (data.type === "training-log") {

        console.log(
            `Época: ${data.epoch}`,
            `Loss: ${data.loss}`,
            `MAE: ${data.mae}`,
            `Val Loss: ${data.validationLoss}`
        );

    }

    // --------------------------------------------------------
    // AVALIAÇÃO DO MODELO
    // --------------------------------------------------------

    if (data.type === "testing-finished") {

        console.log("================================");
        console.log("AVALIAÇÃO FINALIZADA");
        console.log("================================");

        console.log("Loss:", data.loss);
        console.log("MAE:", data.mae);
        console.log("MSE:", data.mse);

    }

    // --------------------------------------------------------
    // TREINAMENTO FINALIZADO
    // --------------------------------------------------------

    if (data.type === "training-finished") {

        console.log("Treinamento concluído!");

    }

    // --------------------------------------------------------
    // TRATAMENTO DE ERROS
    // --------------------------------------------------------

    if (data.type === "training-error") {

        console.error(
            "Erro durante o treinamento:",
            data.message
        );

    }

};

// ============================================================
// TRATAMENTO DE ERROS DO WEB WORKER
// ============================================================

// Captura erros que acontecem durante a execução do Worker,
// inclusive problemas no carregamento dos módulos.

trainingWorker.onerror = (error) => {

    console.error("Erro no Web Worker:", error);

};
