
import { normalizeValue } from "./preprocessing.js";

// ============================================================
// CODIFICAÇÃO DE VALORES BOOLEANOS
// ============================================================

/**
 * Converte um booleano em representação numérica.
 *
 * true  -> 1
 * false -> 0
 */
export function encodeBoolean(value) {
    return value ? 1 : 0;
}


// ============================================================
// CODIFICAÇÃO ONE-HOT
// ============================================================

/**
 * Converte uma categoria em um vetor One-Hot.
 *
 * Exemplo:
 * ["Centro", "Gleba Palhano", "Vila Nova"]
 *
 * Entrada: "Gleba Palhano"
 * Saída:   [0, 1, 0]
 *
 * Categorias desconhecidas são representadas por zeros.
 */
export function oneHotEncode(value, categories) {
    return categories.map(category =>
        category === value ? 1 : 0
    );
}


// ============================================================
// CODIFICAÇÃO DAS CARACTERÍSTICAS CATEGÓRICAS
// ============================================================

export function encodeCategoricalFeatures(
    property,
    trainingContext
) {
    const neighborhoods =
        trainingContext.categories.neighborhoods;

    const conditions =
        trainingContext.categories.conditions;

    return [
        ...oneHotEncode(property.neighborhood, neighborhoods),
        ...oneHotEncode(property.condition, conditions),
        encodeBoolean(property.hasPool)
    ];
}


// ============================================================
// PREPARAÇÃO DAS CARACTERÍSTICAS DE ENTRADA (X)
// ============================================================

/**
 * Prepara somente as características de entrada.
 *
 * Não exige o preço do imóvel.
 *
 * Será utilizada tanto durante o treinamento
 * quanto na previsão de imóveis novos.
 */
export function encodePropertyFeatures(
    property,
    trainingContext
) {
    const limits = trainingContext.numericLimits;

    // Normaliza as características numéricas.
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

    // Codifica as características categóricas e booleanas.
    const encodedFeatures = encodeCategoricalFeatures(
        property,
        trainingContext
    );

    // Monta o vetor final de entrada.
    return [
        normalizedArea,
        normalizedBedrooms,
        normalizedBathrooms,
        normalizedAge,
        normalizedParkingSpaces,
        ...encodedFeatures
    ];
}


// ============================================================
// PREPARAÇÃO COMPLETA PARA TREINAMENTO (X E Y)
// ============================================================

/**
 * Prepara um imóvel para treinamento.
 *
 * X: características de entrada.
 * Y: preço normalizado esperado.
 */
export function encodeProperty(property, trainingContext) {
    const features = encodePropertyFeatures(
        property,
        trainingContext
    );

    const priceLimits = trainingContext.numericLimits.price;

    const normalizedPrice = normalizeValue(
        property.price,
        priceLimits.min,
        priceLimits.max
    );

    return {
        X: features,
        Y: normalizedPrice
    };
}
