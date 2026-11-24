import { Info } from "lucide-react";

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from "@/components/ui/tooltip";

// Explicações das métricas, em linguagem simples.
const METRIC_INFO = {
    Loss: {
        title: "Loss (perda)",
        meaning:
            "É o valor que a rede tenta minimizar ao treinar. Neste modelo, a perda é o MSE medido nos dados de teste.",
        reading: "Quanto menor, melhor. Zero seria um modelo perfeito."
    },
    MAE: {
        title: "MAE (erro absoluto médio)",
        meaning:
            "Média da diferença, sem sinal, entre o preço previsto e o preço real dos imóveis de teste.",
        reading:
            "Os preços são normalizados entre 0 e 1: um MAE de 0,03 equivale a errar, em média, cerca de 3% da faixa de preços."
    },
    MSE: {
        title: "MSE (erro quadrático médio)",
        meaning:
            "Média dos erros elevados ao quadrado, o que penaliza mais os erros grandes.",
        reading:
            "Quanto menor, melhor. Costuma ser bem menor que o MAE porque está na escala normalizada ao quadrado."
    }
};

/**
 * Nome de uma métrica com um ícone de ajuda que explica o seu significado.
 * Nomes sem explicação cadastrada aparecem como texto simples.
 */
function MetricLabel({ name }) {
    const info = METRIC_INFO[name];

    if (!info) return name;

    return (
        <span className="inline-flex items-center gap-1.5">
            {name}

            <Tooltip>
                <TooltipTrigger
                    delay={100}
                    render={
                        <button
                            type="button"
                            aria-label={`O que é ${info.title}`}
                            className="rounded-full text-muted-foreground outline-none transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        />
                    }
                >
                    <Info className="size-3.5" />
                </TooltipTrigger>

                <TooltipContent className="block max-w-72 rounded-lg px-3 py-2.5 text-left leading-relaxed">
                    <p className="font-semibold">{info.title}</p>
                    <p className="mt-1">{info.meaning}</p>
                    <p className="mt-1 opacity-80">{info.reading}</p>
                </TooltipContent>
            </Tooltip>
        </span>
    );
}

export default MetricLabel;
