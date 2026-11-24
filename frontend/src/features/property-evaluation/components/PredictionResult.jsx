
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

import {
    TrendingUp,
    House,
    BedDouble,
    Bath,
    Car,
    Ruler,
    Calendar,
    Waves,
    TriangleAlert
} from "lucide-react";

const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
});

function PredictionResult({ result }) {
    if (!result) {
        return (
            <Card className="flex min-h-[420px] items-center justify-center border-dashed">
                <CardContent className="text-center">
                    <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                        <House className="size-7 text-muted-foreground" />
                    </div>

                    <h3 className="font-semibold">
                        Aguardando avaliação
                    </h3>

                    <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                        Preencha as características do imóvel para visualizar a estimativa.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const details = [
        { label: "Área", value: `${result.property.area} m²`, icon: Ruler },
        { label: "Quartos", value: result.property.bedrooms, icon: BedDouble },
        { label: "Banheiros", value: result.property.bathrooms, icon: Bath },
        { label: "Garagem", value: result.property.parkingSpaces, icon: Car },
        { label: "Idade", value: `${result.property.age} anos`, icon: Calendar },
        { label: "Piscina", value: result.property.hasPool ? "Sim" : "Não", icon: Waves }
    ];

    return (
        <div className="space-y-4">

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Resultado da avaliação</CardTitle>
                        <Badge variant="secondary">
                            Estimativa
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent>
                    <div className="rounded-xl bg-primary/5 p-6">
                        <p className="text-sm text-muted-foreground">
                            Preço estimado do imóvel
                        </p>

                        <p className="mt-2 text-4xl font-bold tracking-tight text-primary tabular-nums">
                            {currency.format(result.price)}
                        </p>

                        {result.range ? (
                            <p className="mt-3 text-sm text-muted-foreground">
                                Faixa provável:{" "}
                                <strong className="text-foreground">
                                    {currency.format(result.range.low)} a {currency.format(result.range.high)}
                                </strong>
                            </p>
                        ) : null}

                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp size={16} />
                            <span>Previsão gerada pela rede neural treinada</span>
                        </div>

                        <p className="mt-2 text-xs text-muted-foreground">
                            {!result.saved
                                ? "Não foi possível registrar esta avaliação no banco (API indisponível?)."
                                : result.createdPropertyId
                                    ? `Avaliação registrada. O imóvel foi salvo no cadastro como #${result.createdPropertyId}.`
                                    : "Avaliação registrada no histórico do Dashboard."}
                        </p>
                    </div>

                    {result.warnings?.length > 0 && (
                        <div
                            role="alert"
                            className="mt-4 space-y-1 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-400"
                        >
                            <p className="flex items-center gap-2 font-medium">
                                <TriangleAlert className="size-4 shrink-0" />
                                Estimativa menos confiável
                            </p>

                            {result.warnings.map((warning) => (
                                <p key={warning}>{warning}</p>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Características analisadas</CardTitle>
                </CardHeader>

                <CardContent>
                    <div className="grid grid-cols-2 gap-4">

                        {details.map(({ label, value, icon: Icon }) => (
                            <div key={label} className="flex items-center gap-3">
                                <div className="rounded-lg bg-muted p-2">
                                    <Icon size={18} />
                                </div>

                                <div>
                                    <p className="text-xs text-muted-foreground">
                                        {label}
                                    </p>

                                    <p className="text-sm font-medium">
                                        {value}
                                    </p>
                                </div>
                            </div>
                        ))}

                    </div>

                    <div className="mt-5 border-t pt-4">
                        <p className="text-xs text-muted-foreground">
                            Bairro: <strong>{result.property.neighborhood}</strong>
                        </p>

                        <p className="mt-1 text-xs text-muted-foreground">
                            Condição: <strong>{result.property.condition}</strong>
                        </p>
                    </div>
                </CardContent>
            </Card>

            <p className="text-xs leading-relaxed text-muted-foreground">
                Esta estimativa é gerada por um modelo de aprendizado de máquina
                treinado com dados disponíveis no projeto. A faixa provável usa o erro
                médio medido nos dados de teste. Não representa uma
                avaliação imobiliária oficial nem substitui a análise de um profissional.
            </p>

        </div>
    );
}

export default PredictionResult;
