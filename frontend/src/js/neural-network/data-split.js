
/**
 * Divide os dados em conjuntos de treinamento,
 * validação e teste.
 *
 * Antes da divisão, embaralha os registros para
 * evitar que a ordem original influencie os conjuntos.
 *
 * @param {Array} properties - Lista de imóveis.
 * @returns {Object} Conjuntos separados.
 */
export function splitData(properties) {
    if (!properties || properties.length < 3) {
        throw new Error("É necessário fornecer pelo menos 3 imóveis.");
    }

    // Cria uma cópia para não modificar o array original.
    const shuffledProperties = [...properties];

    // Embaralha os imóveis utilizando Fisher-Yates.
    for (let i = shuffledProperties.length - 1; i > 0; i--) {
        const randomIndex = Math.floor(Math.random() * (i + 1));

        [shuffledProperties[i], shuffledProperties[randomIndex]] =
            [shuffledProperties[randomIndex], shuffledProperties[i]];
    }

    // Calcula a quantidade de registros de cada conjunto.
    const trainingSize = Math.floor(properties.length * 0.70);
    const validationSize = Math.floor(properties.length * 0.15);

    // Separa os registros.
    const training = shuffledProperties.slice(0, trainingSize);

    const validation = shuffledProperties.slice(
        trainingSize,
        trainingSize + validationSize
    );

    const test = shuffledProperties.slice(
        trainingSize + validationSize
    );

    return {
        training,
        validation,
        test
    };
}
