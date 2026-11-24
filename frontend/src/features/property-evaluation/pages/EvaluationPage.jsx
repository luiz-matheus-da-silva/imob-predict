import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BrainCircuit, CircleAlert, LoaderCircle } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import ExistingPropertyPicker from "../components/ExistingPropertyPicker";
import PropertyForm from "../components/PropertyForm";
import PredictionResult from "../components/PredictionResult";

import { registerEvaluation } from "@/services/evaluations/evaluation.service";
import {
    estimatePrice,
    getModelStatus
} from "@/services/prediction/prediction.service";
import { getProperties } from "@/services/properties/property.service";

const MODES = [
    { key: "existing", label: "Imóvel cadastrado" },
    { key: "new", label: "Novo imóvel" }
];

// A API devolve a área como texto (NUMERIC do PostgreSQL).
function toEvaluable(property) {
    return {
        ...property,
        area: Number(property.area),
        bedrooms: Number(property.bedrooms),
        bathrooms: Number(property.bathrooms),
        age: Number(property.age),
        parkingSpaces: Number(property.parkingSpaces)
    };
}

// =====================================================
// ESTADOS DA PÁGINA
// =====================================================

function CheckingModel() {
    return (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <Skeleton className="h-[520px] rounded-xl" />
            <Skeleton className="h-[420px] rounded-xl" />
        </div>
    );
}

function ModelNotTrained() {
    return (
        <Card className="border-dashed">
            <CardContent className="flex flex-col items-center py-14 text-center">
                <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted">
                    <BrainCircuit className="size-7 text-muted-foreground" />
                </div>

                <h3 className="font-semibold">
                    Nenhum modelo treinado
                </h3>

                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Para estimar preços, a rede neural precisa ser treinada
                    primeiro. O treinamento leva apenas alguns instantes.
                </p>

                <Button className="mt-6" render={<Link to="/treinamento" />}>
                    <BrainCircuit className="size-4" />
                    Treinar modelo
                </Button>
            </CardContent>
        </Card>
    );
}

function ModeSwitch({ mode, onChange }) {
    return (
        <div
            role="group"
            aria-label="Origem do imóvel"
            className="inline-flex rounded-lg bg-muted p-1"
        >
            {MODES.map(({ key, label }) => (
                <button
                    key={key}
                    type="button"
                    aria-pressed={mode === key}
                    onClick={() => onChange(key)}
                    className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                        mode === key
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                    {label}
                </button>
            ))}
        </div>
    );
}

// =====================================================
// PÁGINA
// =====================================================

function EvaluationPage() {
    const [searchParams] = useSearchParams();

    // Vindo do cadastro: /avaliar?imovel=ID já seleciona o imóvel.
    const presetId = searchParams.get("imovel");

    const [status, setStatus] = useState({ state: "checking" });
    const [result, setResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const [mode, setMode] = useState(presetId ? "existing" : null);
    const [selectedId, setSelectedId] = useState(presetId);

    const [properties, setProperties] = useState([]);
    const [propertiesLoaded, setPropertiesLoaded] = useState(false);
    const [propertiesLoading, setPropertiesLoading] = useState(false);
    const [propertiesError, setPropertiesError] = useState("");

    // Sem escolha do usuário: cadastrados se houver, senão formulário.
    const currentMode =
        mode ?? (propertiesLoaded && properties.length === 0 ? "new" : "existing");

    // Verifica se existe um modelo treinado para ser carregado.
    useEffect(() => {
        let cancelled = false;

        getModelStatus()
            .then((modelStatus) => {
                if (cancelled) return;

                setStatus(
                    modelStatus.ready
                        ? { state: "ready", ...modelStatus }
                        : { state: "missing" }
                );
            })
            .catch((statusError) => {
                if (cancelled) return;

                setStatus({ state: "error", message: statusError.message });
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const loadProperties = useCallback(async () => {
        try {
            setPropertiesLoading(true);
            setPropertiesError("");

            setProperties(await getProperties());
        } catch (loadError) {
            setPropertiesError(loadError.message);
        } finally {
            setPropertiesLoading(false);
            setPropertiesLoaded(true);
        }
    }, []);

    useEffect(() => {
        if (status.state === "ready") loadProperties();
    }, [status.state, loadProperties]);

    function changeMode(nextMode) {
        setMode(nextMode);
        setResult(null);
        setError("");
    }

    function selectProperty(id) {
        setSelectedId(id);
        setResult(null);
        setError("");
    }

    // `propertyId` indica um imóvel já cadastrado; sem ele, o imóvel é novo.
    async function handleEvaluate(property, propertyId) {
        setIsLoading(true);
        setError("");
        setResult(null);

        try {
            const evaluable = toEvaluable(property);
            const estimate = await estimatePrice(evaluable);

            // Registra a avaliação para o Dashboard. Uma falha aqui não
            // impede que o usuário veja a estimativa.
            let saved = true;
            let createdPropertyId = null;

            try {
                const registration = await registerEvaluation({
                    propertyId,
                    property: evaluable,
                    predictedPrice: estimate.price,
                    modelVersionId: status.info?.modelVersionId
                });

                if (registration.createdProperty) {
                    createdPropertyId = registration.propertyId;
                    loadProperties();
                }
            } catch {
                saved = false;
            }

            setResult({ ...estimate, property: evaluable, saved, createdPropertyId });
        } catch (evaluationError) {
            setError(evaluationError.message);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="space-y-8">

            <PageHeader
                title="Avaliar imóvel"
                description="Escolha um imóvel cadastrado ou informe um novo para estimar o valor de mercado com a rede neural."
            />

            {status.state === "checking" && <CheckingModel />}

            {status.state === "missing" && <ModelNotTrained />}

            {status.state === "error" && (
                <div
                    role="alert"
                    className="flex items-center gap-2 rounded-lg border border-destructive/40 p-3 text-sm text-destructive"
                >
                    <CircleAlert className="size-4 shrink-0" />
                    Não foi possível verificar o modelo: {status.message}
                </div>
            )}

            {status.state === "ready" && (
                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">

                    <div className="space-y-4">
                        <ModeSwitch mode={currentMode} onChange={changeMode} />

                        {currentMode === "existing" ? (
                            <ExistingPropertyPicker
                                properties={properties}
                                isLoading={propertiesLoading || !propertiesLoaded}
                                error={propertiesError}
                                selectedId={selectedId}
                                onSelect={selectProperty}
                                onRetry={loadProperties}
                                onEvaluate={(property) =>
                                    handleEvaluate(property, property.id)
                                }
                                isEvaluating={isLoading}
                                onSwitchToNew={() => changeMode("new")}
                            />
                        ) : (
                            <>
                                <PropertyForm
                                    onEvaluate={(property) => handleEvaluate(property)}
                                    isLoading={isLoading}
                                    neighborhoods={status.context.categories.neighborhoods}
                                    conditions={status.context.categories.conditions}
                                />

                                <p className="text-xs text-muted-foreground">
                                    O imóvel informado é salvo no cadastro para que a
                                    avaliação fique registrada.
                                </p>
                            </>
                        )}
                    </div>

                    <div className="space-y-4" aria-live="polite">
                        {error && (
                            <div
                                role="alert"
                                className="flex items-center gap-2 rounded-lg border border-destructive/40 p-3 text-sm text-destructive"
                            >
                                <CircleAlert className="size-4 shrink-0" />
                                {error}
                            </div>
                        )}

                        {isLoading ? (
                            <div role="status" aria-busy="true" className="space-y-4">
                                <Card>
                                    <CardContent className="space-y-4">
                                        <p className="flex items-center gap-2 text-sm font-medium">
                                            <LoaderCircle className="size-4 animate-spin text-primary" />
                                            Processando os dados...
                                        </p>

                                        <div className="space-y-3 rounded-xl bg-primary/5 p-6">
                                            <Skeleton className="h-4 w-40" />
                                            <Skeleton className="h-10 w-56" />
                                            <Skeleton className="h-4 w-48" />
                                        </div>

                                        <p className="text-xs text-muted-foreground">
                                            Carregando o modelo e calculando o preço estimado.
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4">
                                            {[0, 1, 2, 3, 4, 5].map((item) => (
                                                <Skeleton key={item} className="h-10" />
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <PredictionResult result={result} />
                        )}
                    </div>

                </div>
            )}

        </div>
    );
}

export default EvaluationPage;
