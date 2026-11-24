import { API_URL } from "@/config/api";
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

/**
 * Lista os imóveis cadastrados (mais recentes primeiro).
 */
export async function getProperties() {
    const body = await request("/properties");

    return body.data ?? [];
}

/**
 * Cadastra um novo imóvel.
 *
 * @param {Object} property
 * @param {number} property.area
 * @param {number} property.bedrooms
 * @param {number} property.bathrooms
 * @param {number} property.age
 * @param {number} property.parkingSpaces
 * @param {string} property.neighborhood
 * @param {string} property.condition
 * @param {boolean} property.hasPool
 */
export async function createProperty(property) {
    const body = await request("/properties", {
        method: "POST",
        body: JSON.stringify(property)
    });

    return body.data;
}

/**
 * Atualiza um imóvel existente.
 *
 * @param {number} id
 * @param {Object} property Mesmos campos de `createProperty`.
 */
export async function updateProperty(id, property) {
    const body = await request(`/properties/${id}`, {
        method: "PUT",
        body: JSON.stringify(property)
    });

    return body.data;
}

/**
 * Exclui um imóvel.
 * A API recusa (409) imóveis que já possuem avaliações.
 *
 * @param {number} id
 */
export async function deleteProperty(id) {
    await request(`/properties/${id}`, { method: "DELETE" });
}
