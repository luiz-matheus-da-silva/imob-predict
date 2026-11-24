import { normalizeValue } from "./preprocessing.js";

/**
 * Converte um valor booleano em representação numérica.
 *
 * true  -> 1
 * false -> 0
 *
 * Utilizado para características como hasPool.
 */
export function encodeBoolean(value) {
    return value ? 1 : 0;
}

/**
 * Converte uma categoria em um vetor One-Hot.
 *
 * Exemplo:
 *
 * Categorias:
 * ["Centro", "Jardim América", "Vila Nova"]
 *
 * Categoria recebida: "Jardim América"
 *
 * Resultado:
 * [0, 1, 0]
 *
 * Categorias desconhecidas são representadas por zeros.
 */
export function oneHotEncode(value, categories) {
    return categories.map(category =>
        category === value ? 1 : 0
    );
}

/**
 * Codifica as características categóricas de um imóvel.
 *
 * Utiliza as categorias armazenadas no contexto
 * de treinamento para manter a mesma estrutura dos vetores.
 */
export function encodeCategoricalFeatures(property, trainingContext) {
    const neighborhoods = trainingContext.categories.neighborhoods;
    const conditions = trainingContext.categories.conditions;

    return [
        ...oneHotEncode(property.neighborhood, neighborhoods),
        ...oneHotEncode(property.condition, conditions),
        encodeBoolean(property.hasPool)
    ];
}

/**
 * Prepara todas as características de um imóvel
 * para serem utilizadas pela rede neural.
 *
 * Retorna:
 * - X: vetor de características.
 * - Y: preço normalizado (alvo).
 */
export function encodeProperty(property, trainingContext) {
    const limits = trainingContext.numericLimits;

    // --------------------------------------------------------
    // CARACTERÍSTICAS NUMÉRICAS
    // --------------------------------------------------------

    const normalizedArea = normalizeValue(
        property.area,
        limits.area.min,
        limits.area.max
    );

    const normalizedBedrooms = normalizeValue(
        property.bedrooms,
        limits.bedrooms.min,
        limits.bedrooms.max
    );

    const normalizedBathrooms = normalizeValue(
        property.bathrooms,
        limits.bathrooms.min,
        limits.bathrooms.max
    );

    const normalizedAge = normalizeValue(
        property.age,
        limits.age.min,
        limits.age.max
    );

    const normalizedParkingSpaces = normalizeValue(
        property.parkingSpaces,
        limits.parkingSpaces.min,
        limits.parkingSpaces.max
    );

    // --------------------------------------------------------
    // CARACTERÍSTICAS CATEGÓRICAS E BOOLEANAS
    // --------------------------------------------------------

    const encodedFeatures = encodeCategoricalFeatures(
        property,
        trainingContext
    );

    // --------------------------------------------------------
    // VETOR FINAL DE ENTRADA (X)
    // --------------------------------------------------------
    const features = [
        normalizedArea,
        normalizedBedrooms,
        normalizedBathrooms,
        normalizedAge,
        normalizedParkingSpaces,
        ...encodedFeatures
    ];

    // --------------------------------------------------------
    // VALOR ESPERADO (Y)
    // --------------------------------------------------------

    const normalizedPrice = normalizeValue(
        property.price,
        limits.price.min,
        limits.price.max
    );

    return {
        X: features,
        Y: normalizedPrice
    };
}