
import * as tf from "@tensorflow/tfjs";

// ============================================================
// CRIAÇÃO E CONFIGURAÇÃO DA REDE NEURAL
// ============================================================

export function createModel(inputDimensions) {

    // Cria uma rede neural sequencial.
    // Os dados passam pelas camadas em sequência,
    // da primeira até a última.
    const model = tf.sequential();

    // --------------------------------------------------------
    // PRIMEIRA CAMADA OCULTA
    // --------------------------------------------------------

    model.add(tf.layers.dense({

        // Quantidade de características recebidas pelo modelo.
        // Exemplo: área, quartos, banheiros, bairro etc.
        inputShape: [inputDimensions],

        // Quantidade de neurônios nesta camada.
        units: 128,

        // ReLU permite aprender relações não lineares.
        activation: 'relu'

    }));

    // --------------------------------------------------------
    // SEGUNDA CAMADA OCULTA
    // --------------------------------------------------------

    model.add(tf.layers.dense({

        // Quantidade de neurônios nesta camada.
        units: 64,

        // Função de ativação.
        activation: 'relu'

    }));

    // --------------------------------------------------------
    // CAMADA DE SAÍDA
    // --------------------------------------------------------

    model.add(tf.layers.dense({

        // Um neurônio porque queremos prever um único valor: o preço.
        units: 1,

        // Ativação linear adequada para problemas de regressão.
        activation: 'linear'

    }));

    // --------------------------------------------------------
    // COMPILAÇÃO DO MODELO
    // --------------------------------------------------------

    model.compile({

        // Adam atualiza os pesos da rede durante o treinamento.
        // 0.001 representa a taxa de aprendizado (learning rate).
        optimizer: tf.train.adam(0.001),

        // MSE calcula a média dos erros das previsões ao quadrado.
        loss: 'meanSquaredError',

        // Métricas utilizadas para acompanhar o desempenho.
        // MAE: erro absoluto médio.
        // MSE: erro quadrático médio.
        metrics: ['mae', 'mse']

    });

    // Retorna o modelo criado e compilado.
    return model;

}
