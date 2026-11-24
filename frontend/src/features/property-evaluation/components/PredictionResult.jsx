
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
    Waves
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

                        <h2 className="mt-2 text-4xl font-bold tracking-tight text-primary">
                            {currency.format(result.price)}
                        </h2>

                        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp size={16} />
                            <span>Previsão gerada pelo modelo</span>
                        </div>
                    </div>
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
                treinado com dados disponíveis no projeto. Não representa uma
                avaliação imobiliária oficial nem substitui a análise de um profissional.
            </p>

        </div>
    );
}

export default PredictionResult;
