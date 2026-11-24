import * as tf from "@tensorflow/tfjs";

import properties from "../data/imobpredict-dataset.json";

import { splitData } from "../neural-network/data-split.js";
import { createTrainingContext } from "../neural-network/preprocessing.js";
import { encodeProperty } from "../neural-network/encoding.js";
import { createModel } from "../neural-network/model.js";

/**
 * Prepara um conjunto de imóveis para o treinamento.
 *
 * Converte os imóveis em tensores de entrada (X)
 * e tensores de saída esperada (Y).
 */
function createTrainingData(properties, trainingContext) {

    if (!properties || properties.length === 0) {
        throw new Error("O conjunto de imóveis está vazio.");
    }

    // Armazena os vetores de entrada (X).
    const trainingInputs = [];

    // Armazena os valores esperados (Y).
    const expectedOutputs = [];

    properties.forEach(property => {

        // Codifica todas as características do imóvel.
        const encodedProperty = encodeProperty(
            property,
            trainingContext
        );

        // Armazena as características do imóvel.
        trainingInputs.push(encodedProperty.X);

        // Armazena o preço normalizado.
        expectedOutputs.push([encodedProperty.Y]);

    });

    // Converte os arrays JavaScript em tensores.
    const inputTensor = tf.tensor2d(trainingInputs);

    const outputTensor = tf.tensor2d(expectedOutputs);

    return {
        inputs: inputTensor,
        outputs: outputTensor,

        // Quantidade de características de cada imóvel.
        inputDimensions: trainingInputs[0].length
    };
}

// --------------------------------------------------------
// PREPARAÇÃO DOS CONJUNTOS DE DADOS
// --------------------------------------------------------

// 1. Separa treinamento, validação e teste.
const datasets = splitData(properties);

// 2. Cria o contexto utilizando somente treinamento.
const trainingContext = createTrainingContext(
    datasets.training
);

// 3. Prepara os dados de treinamento.
const trainingData = createTrainingData(
    datasets.training,
    trainingContext
);

// 4. Prepara os dados de validação.
const validationData = createTrainingData(
    datasets.validation,
    trainingContext
);

// 5. Prepara os dados de teste.
const testData = createTrainingData(
    datasets.test,
    trainingContext
);



// ============================================================
// TREINAMENTO DA REDE NEURAL
// ============================================================

async function trainModel(trainingData, validationData) {

    // Cria e compila a rede neural.
    const model = createModel(trainingData.inputDimensions);

    // Executa o treinamento.
    const history = await model.fit(
        trainingData.inputs,
        trainingData.outputs,
        {
            // Quantidade de vezes que o modelo percorrerá
            // todo o conjunto de treinamento.
            epochs: 100,

            // Quantidade de exemplos processados antes
            // de cada atualização dos pesos.
            batchSize: 32,

            // Embaralha os exemplos a cada época.
            shuffle: true,

            // Avalia o modelo com dados que não participam
            // da atualização dos pesos.
            validationData: [
                validationData.inputs,
                validationData.outputs
            ],

            callbacks: {

                // Executado ao final de cada época.
                onEpochEnd: async (epoch, logs) => {

                    postMessage({
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

    return {
        model,
        history
    };
}


// ============================================================
// EXECUÇÃO DO TREINAMENTO E AVALIAÇÃO
// ============================================================

async function executeTraining() {

    try {

        // Informa que o treinamento começou.
        postMessage({ type: "training-started" });

        // Treina a rede utilizando treinamento e validação.
        const { model } = await trainModel(
            trainingData,
            validationData
        );

        // Avalia o modelo com os dados de teste.
        // Esses dados não participaram do treinamento.
        const testResults = model.evaluate(
            testData.inputs,
            testData.outputs
        );

        // Extrai os resultados das métricas.
        const [testLoss, testMae, testMse] = await Promise.all(
            testResults.map(tensor => tensor.data())
        );

        // Envia os resultados finais para a aplicação principal.
        postMessage({
            type: "testing-finished",
            loss: testLoss[0],
            mae: testMae[0],
            mse: testMse[0]
        });

        // Libera a memória dos tensores de avaliação.
        testResults.forEach(tensor => tensor.dispose());

        // Libera os tensores dos conjuntos de dados.
        trainingData.inputs.dispose();
        trainingData.outputs.dispose();

        validationData.inputs.dispose();
        validationData.outputs.dispose();

        testData.inputs.dispose();
        testData.outputs.dispose();

        // Libera a memória ocupada pelo modelo.
        model.dispose();

    } catch (error) {

        // Comunica erros ocorridos durante o treinamento.
        postMessage({
            type: "training-error",
            message: error.message
        });

    }

}

// Inicia o processo de treinamento.
executeTraining();
