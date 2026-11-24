
import * as tf from "@tensorflow/tfjs";

import properties from "../data/imobpredict-dataset.json";

import { splitData } from "../neural-network/data-split.js";
import { createTrainingContext } from "../neural-network/preprocessing.js";
import { encodeProperty } from "../neural-network/encoding.js";
import { createModel } from "../neural-network/model.js";

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const EPOCHS = 100;
const BATCH_SIZE = 32;

// Impede que dois treinamentos sejam executados simultaneamente.
let isTraining = false;


// ============================================================
// PREPARAÇÃO DOS DADOS
// ============================================================

function createTrainingData(properties, trainingContext) {
    if (!properties || properties.length === 0) {
        throw new Error("O conjunto de imóveis está vazio.");
    }

    const trainingInputs = [];
    const expectedOutputs = [];

    properties.forEach(property => {
        const encodedProperty = encodeProperty(
            property,
            trainingContext
        );

        trainingInputs.push(encodedProperty.X);
        expectedOutputs.push([encodedProperty.Y]);
    });

    return {
        inputs: tf.tensor2d(trainingInputs),
        outputs: tf.tensor2d(expectedOutputs),
        inputDimensions: trainingInputs[0].length
    };
}


// ============================================================
// TREINAMENTO DA REDE NEURAL
// ============================================================

async function trainModel(trainingData, validationData) {
    const model = createModel(trainingData.inputDimensions);

    await model.fit(
        trainingData.inputs,
        trainingData.outputs,
        {
            epochs: EPOCHS,
            batchSize: BATCH_SIZE,
            shuffle: true,

            validationData: [
                validationData.inputs,
                validationData.outputs
            ],

            callbacks: {
                onEpochEnd: async (epoch, logs) => {
                    self.postMessage({
                        type: "training-log",
                        epoch: epoch + 1,
                        loss: logs.loss,
                        mae: logs.mae,
                        mse: logs.mse,
                        validationLoss: logs.val_loss,
                        validationMae: logs.val_mae,
                        validationMse: logs.val_mse
                    });
                }
            }
        }
    );

    return model;
}


// ============================================================
// EXECUÇÃO DO TREINAMENTO E AVALIAÇÃO
// ============================================================

async function executeTraining() {
    if (isTraining) {
        return;
    }

    isTraining = true;

    let trainingData;
    let validationData;
    let testData;
    let model;

    try {
        await tf.ready();

        // 1. Divide os dados em treinamento, validação e teste.
        const datasets = splitData(properties);

        // 2. Aprende os parâmetros somente com os dados de treinamento.
        const trainingContext = createTrainingContext(
            datasets.training
        );

        // 3. Prepara os três conjuntos de dados.
        trainingData = createTrainingData(
            datasets.training,
            trainingContext
        );

        validationData = createTrainingData(
            datasets.validation,
            trainingContext
        );

        testData = createTrainingData(
            datasets.test,
            trainingContext
        );

        // 4. Informa à aplicação que o treinamento começou.
        // O backend utilizará esses dados para criar o histórico.
        // Aguarda autorização da aplicação principal para iniciar.
        self.postMessage({
            type: "training-ready",
            epochs: EPOCHS,
            trainingSamples: datasets.training.length,
            validationSamples: datasets.validation.length,
            testSamples: datasets.test.length
        });

        await new Promise((resolve, reject) => {
            const handleAuthorization = event => {
                if (event.data?.type === "training-authorized") {
                    self.removeEventListener("message", handleAuthorization);
                    resolve();
                }

                if (event.data?.type === "training-cancelled") {
                    self.removeEventListener("message", handleAuthorization);
                    reject(new Error("Treinamento cancelado."));
                }
            };

            self.addEventListener("message", handleAuthorization);
        });

        // 5. Treina a rede neural.
        model = await trainModel(
            trainingData,
            validationData
        );

        // 6. Avalia exclusivamente com os dados de teste.
        const evaluationResults = model.evaluate(
            testData.inputs,
            testData.outputs
        );

        const testTensors = Array.isArray(evaluationResults)
            ? evaluationResults
            : [evaluationResults];

        const metricValues = await Promise.all(
            testTensors.map(tensor => tensor.data())
        );

        const [testLoss, testMae, testMse] = metricValues.map(
            values => values[0]
        );

        // Libera os tensores da avaliação.
        testTensors.forEach(tensor => tensor.dispose());

        // 7. Salva o modelo treinado no IndexedDB.
        const saveResult = await model.save(
            "indexeddb://imobpredict-model"
        );

        // 8. Envia o resultado para a aplicação principal.
        self.postMessage({
            type: "training-finished",

            epochs: EPOCHS,

            trainingContext,

            metrics: {
                loss: testLoss,
                mae: testMae,
                mse: testMse
            },

            trainingSamples: datasets.training.length,
            validationSamples: datasets.validation.length,
            testSamples: datasets.test.length,

            modelInfo: {
                modelName: "imobpredict-model",
                inputDimensions: trainingData.inputDimensions,
                dateSaved: new Date().toISOString(),
                modelArtifactsInfo: saveResult
            }
        });

    } catch (error) {
        self.postMessage({
            type: "training-error",
            message: error.message || "Erro durante o treinamento."
        });

    } finally {
        // Libera os tensores dos conjuntos de dados.
        trainingData?.inputs.dispose();
        trainingData?.outputs.dispose();

        validationData?.inputs.dispose();
        validationData?.outputs.dispose();

        testData?.inputs.dispose();
        testData?.outputs.dispose();

        // Libera o modelo somente depois de salvá-lo.
        model?.dispose();

        isTraining = false;
    }
}


// ============================================================
// COMUNICAÇÃO COM A APLICAÇÃO PRINCIPAL
// ============================================================

// O treinamento só começa quando o React solicitar.
self.addEventListener("message", event => {
    if (event.data?.type === "start-training") {
        executeTraining();
    }
});
