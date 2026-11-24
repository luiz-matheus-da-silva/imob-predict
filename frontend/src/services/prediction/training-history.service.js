
const API_URL = "http://localhost:3000/api";

export async function getTrainingHistory() {
    const response = await fetch(`${API_URL}/training-runs`);

    if (!response.ok) {
        throw new Error("Não foi possível carregar o histórico.");
    }

    const data = await response.json();

    // Aceita tanto uma resposta direta quanto uma resposta envelopada.
    if (Array.isArray(data)) {
        return data;
    }

    return data.trainingRuns ?? data.data ?? [];
}
