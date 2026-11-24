
import { useState } from "react";

import PropertyForm from "../components/PropertyForm";
import PredictionResult from "../components/PredictionResult";

function EvaluationPage() {
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    async function handleEvaluate(property) {
        setIsLoading(true);
        setResult(null);

        // Simulação temporária da previsão.
        await new Promise((resolve) => setTimeout(resolve, 1200));

        const estimatedPrice =
            property.area * 4500 +
            property.bedrooms * 15000 +
            property.parkingSpaces * 12000;

        setResult({
            price: estimatedPrice,
            property
        });

        setIsLoading(false);
    }

    return (
        <div className="space-y-8">

            <section>
                <h2 className="text-2xl font-bold tracking-tight">
                    Avaliar imóvel
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                    Informe as características para estimar o valor de mercado.
                </p>
            </section>

            <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">

                <PropertyForm
                    onEvaluate={handleEvaluate}
                    isLoading={isLoading}
                />

                <PredictionResult result={result} />

            </div>

        </div>
    );
}

export default EvaluationPage;
