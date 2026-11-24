import { Link } from "react-router-dom";

import {
    Bath,
    BedDouble,
    Building,
    Calculator,
    Calendar,
    Car,
    CircleAlert,
    LoaderCircle,
    Ruler,
    Waves
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

function optionLabel(property) {
    return `#${property.id} · ${property.neighborhood} · ${Number(property.area)} m² · ${property.bedrooms} ${property.bedrooms === 1 ? "quarto" : "quartos"}`;
}

function PropertySummary({ property }) {
    const items = [
        { label: "Área", value: `${Number(property.area)} m²`, icon: Ruler },
        { label: "Quartos", value: property.bedrooms, icon: BedDouble },
        { label: "Banheiros", value: property.bathrooms, icon: Bath },
        { label: "Vagas", value: property.parkingSpaces, icon: Car },
        { label: "Idade", value: `${property.age} ${property.age === 1 ? "ano" : "anos"}`, icon: Calendar },
        { label: "Piscina", value: property.hasPool ? "Sim" : "Não", icon: Waves }
    ];

    return (
        <div className="space-y-4 rounded-lg border bg-muted/40 p-4">
            <div>
                <p className="font-medium">{property.neighborhood}</p>
                <p className="text-sm text-muted-foreground">
                    Conservação: {property.condition}
                </p>
            </div>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {items.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-2.5">
                        <div className="rounded-md bg-background p-1.5">
                            <Icon className="size-4 text-muted-foreground" />
                        </div>

                        <div>
                            <dt className="text-xs text-muted-foreground">{label}</dt>
                            <dd className="text-sm font-medium">{value}</dd>
                        </div>
                    </div>
                ))}
            </dl>
        </div>
    );
}

/**
 * Escolha de um imóvel já cadastrado para ser avaliado.
 * A avaliação reaproveita o cadastro: nenhum imóvel novo é criado.
 */
function ExistingPropertyPicker({
    properties,
    isLoading,
    error,
    selectedId,
    onSelect,
    onRetry,
    onEvaluate,
    isEvaluating,
    onSwitchToNew
}) {
    const selected = properties.find(
        (property) => String(property.id) === String(selectedId)
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Imóvel cadastrado</CardTitle>

                <CardDescription>
                    Escolha um imóvel do cadastro para estimar o preço.
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                {isLoading ? (
                    <div role="status" aria-busy="true" className="space-y-3">
                        <span className="sr-only">Carregando imóveis...</span>
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <Skeleton className="h-32 w-full rounded-lg" />
                    </div>
                ) : error ? (
                    <div className="py-6 text-center">
                        <p className="flex items-center justify-center gap-2 text-sm text-destructive">
                            <CircleAlert className="size-4 shrink-0" />
                            {error}
                        </p>

                        <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={onRetry}
                        >
                            Tentar novamente
                        </Button>
                    </div>
                ) : properties.length === 0 ? (
                    <div className="flex flex-col items-center py-8 text-center">
                        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                            <Building className="size-6 text-muted-foreground" />
                        </div>

                        <p className="font-medium">Nenhum imóvel cadastrado</p>

                        <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                            Cadastre imóveis para reavaliá-los quando quiser, ou
                            informe os dados de um imóvel novo.
                        </p>

                        <div className="mt-4 flex flex-wrap justify-center gap-2">
                            <Button size="sm" render={<Link to="/imoveis" />}>
                                Cadastrar imóvel
                            </Button>

                            <Button variant="outline" size="sm" onClick={onSwitchToNew}>
                                Informar um imóvel novo
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <Label>Imóvel</Label>

                            <Select value={selectedId ?? null} onValueChange={onSelect}>
                                <SelectTrigger>
                                    <SelectValue className="min-w-0 flex-1">
                                        {(value) => {
                                            const property = properties.find(
                                                (item) => String(item.id) === String(value)
                                            );

                                            return property ? (
                                                <span className="truncate">
                                                    {optionLabel(property)}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    Selecione um imóvel
                                                </span>
                                            );
                                        }}
                                    </SelectValue>
                                </SelectTrigger>

                                <SelectContent
                                    alignItemWithTrigger={false}
                                    className="w-auto min-w-(--anchor-width) max-w-[calc(100vw-2rem)]"
                                >
                                    {properties.map((property) => (
                                        <SelectItem
                                            key={property.id}
                                            value={String(property.id)}
                                        >
                                            {optionLabel(property)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selected ? (
                            <PropertySummary property={selected} />
                        ) : (
                            <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                                Os dados do imóvel escolhido aparecem aqui.
                            </p>
                        )}

                        <Button
                            className="w-full"
                            disabled={!selected || isEvaluating}
                            onClick={() => onEvaluate(selected)}
                        >
                            {isEvaluating ? (
                                <>
                                    <LoaderCircle className="size-4 animate-spin" />
                                    Calculando estimativa...
                                </>
                            ) : (
                                <>
                                    <Calculator className="size-4" />
                                    Estimar preço do imóvel
                                </>
                            )}
                        </Button>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

export default ExistingPropertyPicker;
