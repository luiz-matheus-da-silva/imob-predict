import { API_URL } from "@/config/api";
import { createProperty } from "@/services/properties/property.service";


async function request(endpoint, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
            "Content-Type": "application/json"
        },
        ...options
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(body.message || "Erro ao comunicar com a API.");
    }

    return body;
}

// O PostgreSQL devolve COUNT e NUMERIC como texto.
function toNumber(value) {
    return value === null || value === undefined ? null : Number(value);
}

/**
 * Indicadores gerais das avaliações.
 */
export async function getEvaluationStatistics() {
    const row = await request("/evaluations/statistics");

    return {
        total: toNumber(row.total_evaluations) ?? 0,
        averagePrice: toNumber(row.average_price),
        highestPrice: toNumber(row.highest_price),
        lowestPrice: toNumber(row.lowest_price)
    };
}

/**
 * Avaliações registradas, da mais recente para a mais antiga.
 */
export async function getEvaluations() {
    const rows = await request("/evaluations");

    return rows.map((row) => ({
        id: row.id,
        predictedPrice: Number(row.predicted_price),
        createdAt: row.created_at,
        modelVersion: row.model_version,
        property: {
            id: row.property_id,
            area: Number(row.area),
            bedrooms: row.bedrooms,
            bathrooms: row.bathrooms,
            age: row.age,
            parkingSpaces: row.parking_spaces,
            neighborhood: row.neighborhood,
            condition: row.condition,
            hasPool: row.has_pool
        }
    }));
}

/**
 * Versões de modelo cadastradas, da mais recente para a mais antiga.
 */
export async function getModelVersions() {
    const rows = await request("/model-versions");

    return rows.map((row) => ({
        id: row.id,
        version: row.version,
        mae: toNumber(row.mae),
        mse: toNumber(row.mse),
        loss: toNumber(row.loss),
        trainingSamples: row.training_samples,
        isActive: row.is_active,
        createdAt: row.created_at
    }));
}

/**
 * Registra uma avaliação no banco, ligando o preço estimado à versão do modelo.
 *
 * - Com `propertyId`, reaproveita um imóvel já cadastrado (nada é duplicado).
 * - Sem ele, salva `property` como um novo imóvel no cadastro.
 *
 * @param {Object} params
 * @param {number} [params.propertyId] Imóvel já cadastrado.
 * @param {Object} [params.property] Características de um imóvel novo.
 * @param {number} params.predictedPrice Preço estimado (em reais).
 * @param {number} [params.modelVersionId] Versão usada; se ausente, usa a ativa.
 * @returns {Promise<{ propertyId: number, createdProperty: boolean }>}
 */
export async function registerEvaluation({
    propertyId,
    property,
    predictedPrice,
    modelVersionId
}) {
    let versionId = modelVersionId;

    if (!versionId) {
        const versions = await getModelVersions();

        versionId = versions.find((version) => version.isActive)?.id;
    }

    if (!versionId) {
        throw new Error("Nenhuma versão de modelo cadastrada no banco.");
    }

    let targetId = propertyId;
    let createdProperty = false;

    if (!targetId) {
        const savedProperty = await createProperty(property);

        targetId = savedProperty.id;
        createdProperty = true;
    }

    // O preço é arredondado para centavos (coluna NUMERIC(15, 2)).
    await request("/evaluations", {
        method: "POST",
        body: JSON.stringify({
            propertyId: Number(targetId),
            modelVersionId: Number(versionId),
            predictedPrice: Math.round(predictedPrice * 100) / 100
        })
    });

    return { propertyId: Number(targetId), createdProperty };
}
