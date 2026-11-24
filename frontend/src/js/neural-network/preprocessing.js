
/**
 * Normaliza um valor numérico entre 0 e 1.
 *
 * Fórmula:
 * (valor - mínimo) / (máximo - mínimo)
 *
 * Exemplo:
 * valor = 125
 * mínimo = 50
 * máximo = 200
 *
 * Resultado: 0.5
 */
export function normalizeValue(value, minimum, maximum) {
    const range = maximum - minimum;

    // Evita divisão por zero quando todos os valores são iguais.
    if (range === 0) {
        return 0;
    }

    return (value - minimum) / range;
}

/**
 * Identifica os limites de uma característica numérica.
 *
 * Exemplo:
 * [50, 100, 200]
 *
 * Resultado:
 * {
 *     min: 50,
 *     max: 200
 * }
 */
export function getMinMax(values) {
    if (values.length === 0) {
        throw new Error("Não é possível calcular limites de uma lista vazia.");
    }

    return {
        min: Math.min(...values),
        max: Math.max(...values)
    };
}

/**
 * Cria o contexto de treinamento.
 *
 * Armazena:
 * - Limites dos atributos numéricos.
 * - Categorias conhecidas durante o treinamento.
 *
 * IMPORTANTE:
 * Deve receber somente os dados de treinamento.
 */
export function createTrainingContext(properties) {
    if (!properties || properties.length === 0) {
        throw new Error("O conjunto de treinamento está vazio.");
    }

    // Extrai os atributos numéricos dos imóveis.
    const propAreas = properties.map(p => p.area);
    const propBedrooms = properties.map(p => p.bedrooms);
    const propBathrooms = properties.map(p => p.bathrooms);
    const propAges = properties.map(p => p.age);
    const propParkingSpaces = properties.map(p => p.parkingSpaces);
    const propPrices = properties.map(p => p.price);

    // Calcula os limites de cada atributo numérico.
    const areaLimits = getMinMax(propAreas);
    const bedroomLimits = getMinMax(propBedrooms);
    const bathroomLimits = getMinMax(propBathrooms);
    const ageLimits = getMinMax(propAges);
    const parkingSpaceLimits = getMinMax(propParkingSpaces);
    const priceLimits = getMinMax(propPrices);

    // Identifica os bairros existentes no treinamento.
    const neighborhoods = [
        ...new Set(properties.map(p => p.neighborhood))
    ];

    // Identifica as condições existentes no treinamento.
    const conditions = [
        ...new Set(properties.map(p => p.condition))
    ];

    // Retorna os parâmetros necessários para preparar os dados.
    return {
        numericLimits: {
            area: areaLimits,
            bedrooms: bedroomLimits,
            bathrooms: bathroomLimits,
            age: ageLimits,
            parkingSpaces: parkingSpaceLimits,
            price: priceLimits
        },

        categories: {
            neighborhoods,
            conditions
        }
    };
}
