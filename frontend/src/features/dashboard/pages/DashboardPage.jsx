import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import {
    Bar,
    BarChart,
    CartesianGrid,
    LabelList,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis
} from "recharts";

import {
    BrainCircuit,
    ChartNoAxesCombined,
    CircleAlert,
    ClipboardList,
    DollarSign,
    LoaderCircle,
    RefreshCw,
    Calculator,
    TrendingUp
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { useSort } from "@/hooks/useSort";
import { formatRelative } from "@/lib/format";
import MetricLabel from "@/components/shared/MetricLabel";
import SortableHead from "@/components/shared/SortableHead";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";

import trainingDataset from "@/js/data/imobpredict-dataset.json";
import {
    getEvaluationStatistics,
    getEvaluations,
    getModelVersions
} from "@/services/evaluations/evaluation.service";
import {
    loadModelInfo,
    loadTrainingContext
} from "@/services/prediction/model-storage";

// =====================================================
// FORMATAÇÃO
// =====================================================

const currency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
});

const compactCurrency = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    notation: "compact",
    maximumFractionDigits: 0
});

const dateTime = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
});

function formatDateTime(value) {
    return value ? dateTime.format(new Date(value)) : "-";
}

function formatPercent(value) {
    return `${Number(value).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

// MAE e MSE normalizados ficam entre 0 e 1. Valores fora disso vêm de outra
// escala (por exemplo, um registro de teste feito direto na API).
function sanitizeVersion(version) {
    const isValid = [version.mae, version.mse].every(
        (value) => Number.isFinite(value) && value >= 0 && value <= 1
    );

    return isValid
        ? { ...version, metricsValid: true }
        : { ...version, mae: null, mse: null, loss: null, metricsValid: false };
}

function formatMetric(value) {
    return typeof value === "number"
        ? value.toLocaleString("pt-BR", { maximumFractionDigits: 6 })
        : "-";
}

const tooltipStyle = {
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--popover)",
    color: "var(--popover-foreground)",
    fontSize: 12
};

// =====================================================
// COMPONENTES BASE
// =====================================================

function StatCard({ title, value, description, icon: Icon, isLoading }) {
    return (
        <Card>
            <CardContent className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground">
                        {title}
                    </p>

                    {isLoading ? (
                        <>
                            <Skeleton className="mt-2 h-8 w-28" />
                            <Skeleton className="mt-2 h-3 w-36" />
                        </>
                    ) : (
                        <>
                            <p className="mt-1 truncate text-2xl font-bold tracking-tight">
                                {value}
                            </p>

                            <p className="mt-1 text-xs text-muted-foreground">
                                {description}
                            </p>
                        </>
                    )}
                </div>

                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon size={20} />
                </div>
            </CardContent>
        </Card>
    );
}

function EmptyState({ icon: Icon, title, text, actionLabel, actionTo }) {
    return (
        <div className="flex flex-col items-center py-10 text-center">
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                <Icon className="size-6 text-muted-foreground" />
            </div>

            <p className="font-medium">{title}</p>

            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                {text}
            </p>

            <Button
                variant="outline"
                size="sm"
                className="mt-4"
                render={<Link to={actionTo} />}
            >
                {actionLabel}
            </Button>
        </div>
    );
}

// =====================================================
// DISTRIBUIÇÃO DOS PREÇOS
// =====================================================

// Preços da base usada para treinar o modelo.
const datasetPrices = trainingDataset
    .map((property) => property.price)
    .filter(Number.isFinite);

// Mínimo de avaliações para a distribuição fazer sentido.
const MIN_EVALUATIONS_FOR_CHART = 5;

// Escolhe um passo "redondo" (1, 2, 2,5, 5 ou 10 × potência de 10).
function niceStep(rawStep) {
    if (rawStep <= 0) return 50000;

    const magnitude = 10 ** Math.floor(Math.log10(rawStep));
    const multiple = [1, 2, 2.5, 5, 10].find(
        (candidate) => candidate * magnitude >= rawStep
    );

    return multiple * magnitude;
}

// "300–400 mil" ou "1–1,5 mi": curto o bastante para caber no eixo.
function formatRange(from, to) {
    const scale = to > 1_000_000 ? 1_000_000 : 1000;
    const suffix = scale === 1_000_000 ? "mi" : "mil";

    const format = (value) =>
        (value / scale).toLocaleString("pt-BR", { maximumFractionDigits: 2 });

    return `${format(from)}–${format(to)} ${suffix}`;
}

// Agrupa os preços em faixas de mesmo tamanho.
function buildPriceDistribution(prices, targetBins = 8) {
    if (prices.length === 0) return [];

    const min = Math.min(...prices);
    const max = Math.max(...prices);

    const step = niceStep((max - min) / targetBins);
    const start = Math.floor(min / step) * step;
    const binCount = Math.floor((max - start) / step) + 1;

    const bins = Array.from({ length: binCount }, (_, index) => ({
        from: start + index * step,
        to: start + (index + 1) * step,
        count: 0
    }));

    for (const price of prices) {
        bins[Math.floor((price - start) / step)].count += 1;
    }

    return bins.map((bin) => ({
        ...bin,
        label: formatRange(bin.from, bin.to)
    }));
}

const DISTRIBUTION_SOURCES = {
    dataset: { label: "Base de treinamento" },
    evaluations: { label: "Minhas avaliações" }
};

function PriceDistributionChart({ evaluations, isLoading }) {
    const [source, setSource] = useState("dataset");

    const prices = useMemo(
        () =>
            source === "dataset"
                ? datasetPrices
                : evaluations.map((evaluation) => evaluation.predictedPrice),
        [source, evaluations]
    );

    const data = useMemo(() => buildPriceDistribution(prices), [prices]);

    const hasEnoughData =
        source === "dataset" || prices.length >= MIN_EVALUATIONS_FOR_CHART;

    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;

    return (
        <Card>
            <CardHeader className="border-b">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                        <CardTitle>Distribuição dos preços</CardTitle>
                        <CardDescription>
                            {source === "dataset"
                                ? "Quantos imóveis da base de treinamento existem em cada faixa de preço."
                                : "Quantos imóveis avaliados caem em cada faixa de preço estimado."}
                        </CardDescription>
                    </div>

                    <div
                        role="group"
                        aria-label="Origem dos dados"
                        className="flex shrink-0 rounded-lg bg-muted p-1"
                    >
                        {Object.entries(DISTRIBUTION_SOURCES).map(([key, { label }]) => (
                            <button
                                key={key}
                                type="button"
                                aria-pressed={source === key}
                                onClick={() => setSource(key)}
                                className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                                    source === key
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {isLoading && source === "evaluations" ? (
                    <Skeleton className="h-64 w-full" />
                ) : !hasEnoughData ? (
                    <div className="flex flex-col items-center py-10 text-center">
                        <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-muted">
                            <ChartNoAxesCombined className="size-6 text-muted-foreground" />
                        </div>

                        <p className="font-medium">Poucas avaliações para o gráfico</p>

                        <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                            Há {prices.length}{" "}
                            {prices.length === 1 ? "avaliação" : "avaliações"}; a
                            distribuição fica útil a partir de{" "}
                            {MIN_EVALUATIONS_FOR_CHART}. Enquanto isso, veja a base
                            de treinamento.
                        </p>

                        <div className="mt-4 flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSource("dataset")}
                            >
                                Ver base de treinamento
                            </Button>

                            <Button size="sm" render={<Link to="/avaliar" />}>
                                Avaliar um imóvel
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div
                            className="h-64 w-full"
                            role="img"
                            aria-label={`Distribuição dos preços: ${data
                                .map((bin) => `R$ ${bin.label}, ${bin.count} ${bin.count === 1 ? "imóvel" : "imóveis"}`)
                                .join("; ")}`}
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={data}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                    barCategoryGap={4}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />

                                    <XAxis
                                        dataKey="label"
                                        tickLine={false}
                                        axisLine={false}
                                        fontSize={12}
                                        interval="preserveStartEnd"
                                        minTickGap={8}
                                        tickMargin={8}
                                    />

                                    <YAxis
                                        allowDecimals={false}
                                        tickLine={false}
                                        axisLine={false}
                                        fontSize={12}
                                        width={32}
                                    />

                                    <Tooltip
                                        cursor={{ fill: "var(--muted)" }}
                                        contentStyle={tooltipStyle}
                                        labelFormatter={(_label, payload) =>
                                            payload?.[0]
                                                ? `${currency.format(payload[0].payload.from)} a ${currency.format(payload[0].payload.to)}`
                                                : ""
                                        }
                                        formatter={(value) => [
                                            `${value} ${value === 1 ? "imóvel" : "imóveis"}`,
                                            "Quantidade"
                                        ]}
                                    />

                                    <Bar
                                        dataKey="count"
                                        fill="var(--primary)"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <p className="mt-3 text-xs text-muted-foreground">
                            {prices.length} imóveis · de {currency.format(min)} a{" "}
                            {currency.format(max)}
                        </p>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// =====================================================
// ÚLTIMAS AVALIAÇÕES
// =====================================================

function RecentEvaluations({ evaluations, isLoading }) {
    const recent = evaluations.slice(0, 5);

    return (
        <Card>
            <CardHeader className="border-b">
                <CardTitle>Últimas avaliações</CardTitle>
                <CardDescription>
                    Os cinco imóveis avaliados mais recentemente.
                </CardDescription>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="space-y-4">
                        {[0, 1, 2, 3].map((item) => (
                            <Skeleton key={item} className="h-12 w-full" />
                        ))}
                    </div>
                ) : recent.length === 0 ? (
                    <EmptyState
                        icon={ClipboardList}
                        title="Nenhuma avaliação ainda"
                        text="As avaliações feitas com a rede neural aparecerão aqui."
                        actionLabel="Avaliar um imóvel"
                        actionTo="/avaliar"
                    />
                ) : (
                    <ul className="-my-2 divide-y divide-border">
                        {recent.map(({ id, property, predictedPrice, createdAt }) => (
                            <li
                                key={id}
                                className="-mx-3 flex items-center justify-between gap-4 rounded-md px-3 py-4 transition-colors hover:bg-muted/60"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                        {property.neighborhood} · {property.area} m²
                                    </p>

                                    <p className="truncate text-xs text-muted-foreground">
                                        {property.bedrooms}{" "}
                                        {property.bedrooms === 1 ? "quarto" : "quartos"} ·{" "}
                                        {property.condition}
                                    </p>

                                    <p className="truncate text-xs text-muted-foreground">
                                        {property.bathrooms}{" "}
                                        {property.bathrooms === 1 ? "banheiro" : "banheiros"} ·{" "}
                                        {property.parkingSpaces}{" "}
                                        {property.parkingSpaces === 1 ? "vaga" : "vagas"} ·{" "}
                                        {property.age} {property.age === 1 ? "ano" : "anos"}
                                        {property.hasPool ? " · Piscina" : ""}
                                    </p>
                                </div>

                                <Separator
                                    orientation="vertical"
                                    className="hidden h-12 sm:block"
                                />

                                <div className="w-28 shrink-0 text-right">
                                    <p className="text-sm font-semibold text-primary">
                                        {currency.format(predictedPrice)}
                                    </p>

                                    <time
                                        dateTime={createdAt}
                                        title={formatDateTime(createdAt)}
                                        className="text-xs text-muted-foreground"
                                    >
                                        {formatRelative(createdAt)}
                                    </time>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </CardContent>

            {!isLoading && recent.length > 0 && (
                <CardFooter className="border-t text-xs text-muted-foreground">
                    Exibindo {recent.length} de {evaluations.length}{" "}
                    {evaluations.length === 1 ? "avaliação" : "avaliações"}.
                </CardFooter>
            )}
        </Card>
    );
}

// =====================================================
// DESEMPENHO DOS MODELOS
// =====================================================

// Variação do erro de uma versão em relação à anterior.
function VariationCell({ variation, current }) {
    if (!variation) return <span className="text-muted-foreground">—</span>;

    const { points, relative } = variation;
    const improved = points < 0;

    const format = (value, digits) =>
        Math.abs(value).toLocaleString("pt-BR", {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits
        });

    const previous = (current - points / 100) * 100;

    return (
        <span
            title={`O erro médio foi de ${formatPercent(previous)} para ${formatPercent(current * 100)} da faixa de preços (${format(relative * 100, 1)}% ${improved ? "menor" : "maior"} que o da versão anterior).`}
            className={`whitespace-nowrap font-medium ${
                points === 0
                    ? "text-muted-foreground"
                    : improved
                        ? "text-emerald-700"
                        : "text-amber-700"
            }`}
        >
            {points === 0 ? "=" : improved ? "▼" : "▲"} {format(points, 2)} p.p.
            <span className="ml-1 font-normal text-muted-foreground">
                ({format(relative * 100, 1)}%)
            </span>
        </span>
    );
}

function ModelPerformance({ versions, isLoading }) {
    // Mais antiga primeiro, para o gráfico seguir a ordem do tempo.
    const chronological = useMemo(
        () =>
            [...versions].sort(
                (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
            ),
        [versions]
    );

    const active =
        versions.find((version) => version.isActive) ?? chronological.at(-1);

    // O MAE está normalizado (0 a 1). Com o contexto do treino local,
    // dá para convertê-lo em reais.
    const context = loadTrainingContext();
    const info = loadModelInfo();
    const priceRange = context?.numericLimits?.price;

    const canConvert =
        active &&
        Number.isFinite(active.mae) &&
        priceRange &&
        info?.modelVersionId &&
        Number(info.modelVersionId) === Number(active.id);

    const maeInReais = canConvert
        ? active.mae * (priceRange.max - priceRange.min)
        : null;

    const activePercent =
        active && Number.isFinite(active.mae) ? active.mae * 100 : null;

    // MAE normalizado vira % da faixa de preços: independe da escala.
    const chartData = chronological
        .filter((version) => Number.isFinite(version.mae))
        .slice(-8)
        .map((version) => ({
            name: `#${version.id}`,
            percent: version.mae * 100,
            isActive: version.id === active?.id
        }));

    // Variação do MAE de cada versão em relação à anterior com métricas válidas.
    const variationById = useMemo(() => {
        const map = new Map();
        let previous = null;

        for (const version of chronological) {
            if (!Number.isFinite(version.mae)) continue;

            if (previous && previous.mae > 0) {
                map.set(version.id, {
                    // Diferença em pontos percentuais da faixa de preços.
                    points: (version.mae - previous.mae) * 100,
                    // Variação relativa ao MAE da versão anterior.
                    relative: (version.mae - previous.mae) / previous.mae
                });
            }

            previous = version;
        }

        return map;
    }, [chronological]);

    // Valor de cada coluna usado na ordenação do histórico.
    const sortAccessors = useMemo(
        () => ({
            id: (version) => Number(version.id),
            createdAt: (version) => new Date(version.createdAt).getTime(),
            mae: (version) => version.mae,
            variation: (version) => variationById.get(version.id)?.points ?? null
        }),
        [variationById]
    );

    const { sorted: sortedVersions, sort, toggle } = useSort(versions, sortAccessors);

    return (
        <Card>
            <CardHeader className="border-b">
                <CardTitle>Desempenho dos modelos</CardTitle>
                <CardDescription>
                    Quanto o modelo erra ao estimar preços, medido em dados de teste.
                </CardDescription>
            </CardHeader>

            <CardContent>
                {isLoading ? (
                    <div className="grid gap-8 lg:grid-cols-5">
                        <Skeleton className="h-64 lg:col-span-2" />
                        <Skeleton className="h-64 lg:col-span-3" />
                    </div>
                ) : versions.length === 0 ? (
                    <EmptyState
                        icon={BrainCircuit}
                        title="Nenhum modelo treinado"
                        text="Treine a rede neural para acompanhar o desempenho aqui."
                        actionLabel="Treinar modelo"
                        actionTo="/treinamento"
                    />
                ) : (
                    <div className="space-y-6">

                        <div className="grid gap-8 lg:grid-cols-5">

                            {/* Resumo do modelo ativo */}
                            <div className="space-y-5 lg:col-span-2">
                                <div className="flex flex-wrap items-center gap-2">
                                    <Badge>Modelo ativo #{active.id}</Badge>

                                    <span className="text-xs text-muted-foreground">
                                        treinado {formatRelative(active.createdAt)}
                                    </span>
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        Erro médio por imóvel
                                    </p>

                                    <p className="mt-1 text-4xl font-bold tracking-tight text-primary tabular-nums">
                                        {maeInReais !== null
                                            ? currency.format(maeInReais)
                                            : activePercent !== null
                                                ? formatPercent(activePercent)
                                                : "—"}
                                    </p>

                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {maeInReais !== null && activePercent !== null
                                            ? `${formatPercent(activePercent)} da faixa de preços`
                                            : "da faixa de preços"}
                                    </p>
                                </div>

                                <dl className="divide-y rounded-lg border text-sm">
                                    {[
                                        { label: "MAE", value: formatMetric(active.mae) },
                                        { label: "MSE", value: formatMetric(active.mse) },
                                        { label: "Loss", value: formatMetric(active.loss) },
                                        { label: "Amostras", value: active.trainingSamples }
                                    ].map(({ label, value }) => (
                                        <div
                                            key={label}
                                            className="flex items-center justify-between px-3 py-2"
                                        >
                                            <dt className="text-muted-foreground">
                                                <MetricLabel name={label} />
                                            </dt>

                                            <dd className="font-medium">{value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            </div>

                            {/* Evolução do erro */}
                            <div className="lg:col-span-3">
                                <div className="mb-3">
                                    <p className="text-sm font-medium">
                                        Erro médio por versão
                                    </p>

                                    <p className="text-xs text-muted-foreground">
                                        Em % da faixa de preços · menor é melhor
                                    </p>
                                </div>

                                {chartData.length > 1 ? (
                                    <div
                                        className="h-56 w-full"
                                        role="img"
                                        aria-label={`Erro médio por versão: ${chartData
                                            .map((item) => `${item.name} ${formatPercent(item.percent)}`)
                                            .join("; ")}`}
                                    >
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart
                                                data={chartData}
                                                margin={{ top: 24, right: 24, left: 8, bottom: 0 }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    vertical={false}
                                                />

                                                <XAxis
                                                    dataKey="name"
                                                    tickLine={false}
                                                    axisLine={false}
                                                    fontSize={12}
                                                    padding={{ left: 16, right: 16 }}
                                                />

                                                <YAxis
                                                    tickLine={false}
                                                    axisLine={false}
                                                    fontSize={12}
                                                    width={56}
                                                    tickCount={4}
                                                    domain={[
                                                        (min) => Math.max(0, Math.floor(min - 1)),
                                                        (max) => Math.ceil(max + 1)
                                                    ]}
                                                    tickFormatter={(value) => `${value}%`}
                                                />

                                                <Tooltip
                                                    cursor={{ stroke: "var(--border)" }}
                                                    contentStyle={tooltipStyle}
                                                    formatter={(value) => [
                                                        `${formatPercent(value)} (MAE ${formatMetric(value / 100)})`,
                                                        "Erro médio"
                                                    ]}
                                                />

                                                <Line
                                                    type="monotone"
                                                    dataKey="percent"
                                                    stroke="var(--primary)"
                                                    strokeWidth={2}
                                                    isAnimationActive={false}
                                                    dot={({ cx, cy, payload, index }) => (
                                                        <circle
                                                            key={index}
                                                            cx={cx}
                                                            cy={cy}
                                                            r={payload.isActive ? 6 : 4}
                                                            fill={payload.isActive ? "var(--primary)" : "var(--card)"}
                                                            stroke="var(--primary)"
                                                            strokeWidth={2}
                                                        />
                                                    )}
                                                >
                                                    <LabelList
                                                        dataKey="percent"
                                                        position="top"
                                                        offset={10}
                                                        fontSize={12}
                                                        formatter={formatPercent}
                                                    />
                                                </Line>
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                ) : (
                                    <p className="flex h-56 items-center justify-center rounded-lg border border-dashed px-6 text-center text-sm text-muted-foreground">
                                        O comparativo aparece a partir do segundo treinamento.
                                    </p>
                                )}
                            </div>

                        </div>

                        {/* Histórico de versões (recolhido por padrão) */}
                        <details className="rounded-lg border">
                            <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium">
                                Histórico de versões ({versions.length})
                            </summary>

                            <div className="border-t">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <SortableHead label="Versão" sortKey="id" sort={sort} onSort={toggle} />
                                            <SortableHead label="Treinada em" sortKey="createdAt" sort={sort} onSort={toggle} />
                                            <SortableHead label="MAE" sortKey="mae" sort={sort} onSort={toggle} />
                                            <SortableHead label="Variação do erro" sortKey="variation" sort={sort} onSort={toggle} />
                                            <TableHead className="text-right">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>

                                    <TableBody>
                                        {sortedVersions.slice(0, 5).map((version) => (
                                            <TableRow key={version.id}>
                                                <TableCell className="font-medium">
                                                    #{version.id}
                                                </TableCell>
                                                <TableCell className="whitespace-nowrap text-muted-foreground">
                                                    {formatDateTime(version.createdAt)}
                                                </TableCell>
                                                <TableCell>{formatMetric(version.mae)}</TableCell>
                                                <TableCell>
                                                    <VariationCell
                                                        variation={variationById.get(version.id)}
                                                        current={version.mae}
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {version.isActive ? (
                                                        <Badge>Ativo</Badge>
                                                    ) : !version.metricsValid ? (
                                                        <span
                                                            className="text-xs text-destructive"
                                                            title="As métricas deste registro estão em outra escala e foram ignoradas."
                                                        >
                                                            Métricas inválidas
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">
                                                            Anterior
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </details>

                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// =====================================================
// PÁGINA
// =====================================================

function DashboardPage() {
    const [data, setData] = useState({
        statistics: null,
        evaluations: [],
        versions: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatedAt, setUpdatedAt] = useState(null);

    const load = useCallback(async () => {
        try {
            setIsLoading(true);
            setError("");

            const [statistics, evaluations, versions] = await Promise.all([
                getEvaluationStatistics(),
                getEvaluations(),
                getModelVersions()
            ]);

            setData({
                statistics,
                evaluations,
                versions: versions.map(sanitizeVersion)
            });
            setUpdatedAt(new Date());
        } catch (loadError) {
            setError(loadError.message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const { statistics, evaluations, versions } = data;

    const activeVersion = versions.find((version) => version.isActive);

    const lastWeekCount = useMemo(() => {
        const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

        return evaluations.filter(
            (evaluation) => new Date(evaluation.createdAt).getTime() >= weekAgo
        ).length;
    }, [evaluations]);

    return (
        <div className="space-y-8">

            <PageHeader
                title="Dashboard"
                description={
                    <>
                        Visão geral das avaliações imobiliárias e do modelo.
                        {updatedAt && (
                            <>
                                {" "}
                                Atualizado às{" "}
                                {updatedAt.toLocaleTimeString("pt-BR", {
                                    hour: "2-digit",
                                    minute: "2-digit"
                                })}
                                .
                            </>
                        )}
                    </>
                }
                actions={
                    <>
                        <Button
                            variant="outline"
                            onClick={load}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <LoaderCircle className="size-4 animate-spin" />
                            ) : (
                                <RefreshCw className="size-4" />
                            )}
                            Atualizar
                        </Button>

                        <Button render={<Link to="/avaliar" />}>
                            <Calculator className="size-4" />
                            Avaliar imóvel
                        </Button>
                    </>
                }
            />

            {error && (
                <div
                    role="alert"
                    className="flex items-center gap-2 rounded-lg border border-destructive/40 p-3 text-sm text-destructive"
                >
                    <CircleAlert className="size-4 shrink-0" />

                    <span className="flex-1">
                        Não foi possível carregar os dados: {error}
                    </span>

                    <Button variant="outline" size="sm" onClick={load}>
                        Tentar novamente
                    </Button>
                </div>
            )}

            {/* Indicadores */}
            <section
                aria-label="Indicadores"
                className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >

                <StatCard
                    title="Imóveis avaliados"
                    value={statistics?.total ?? 0}
                    description={
                        lastWeekCount > 0
                            ? `${lastWeekCount} nos últimos 7 dias`
                            : "Nenhuma nos últimos 7 dias"
                    }
                    icon={ClipboardList}
                    isLoading={isLoading}
                />

                <StatCard
                    title="Preço médio estimado"
                    value={
                        statistics?.averagePrice != null
                            ? currency.format(statistics.averagePrice)
                            : "-"
                    }
                    description="Média de todas as avaliações"
                    icon={DollarSign}
                    isLoading={isLoading}
                />

                <StatCard
                    title="Maior avaliação"
                    value={
                        statistics?.highestPrice != null
                            ? currency.format(statistics.highestPrice)
                            : "-"
                    }
                    description={
                        statistics?.lowestPrice != null
                            ? `Menor: ${currency.format(statistics.lowestPrice)}`
                            : "Sem avaliações ainda"
                    }
                    icon={TrendingUp}
                    isLoading={isLoading}
                />

                <StatCard
                    title="Último treinamento"
                    value={activeVersion ? formatRelative(activeVersion.createdAt) : "-"}
                    description={
                        activeVersion
                            ? `Modelo #${activeVersion.id} · ${versions.length} ${versions.length === 1 ? "versão treinada" : "versões treinadas"}`
                            : "Nenhum modelo treinado"
                    }
                    icon={BrainCircuit}
                    isLoading={isLoading}
                />

            </section>

            {/* Distribuição dos preços e últimas avaliações */}
            <section className="grid gap-6 xl:grid-cols-5">
                <div className="xl:col-span-3 [&>[data-slot=card]]:h-full">
                    <PriceDistributionChart
                        evaluations={evaluations}
                        isLoading={isLoading}
                    />
                </div>

                <div className="xl:col-span-2 [&>[data-slot=card]]:h-full">
                    <RecentEvaluations
                        evaluations={evaluations}
                        isLoading={isLoading}
                    />
                </div>
            </section>

            {/* Desempenho dos modelos */}
            <section>
                <ModelPerformance
                    versions={versions}
                    isLoading={isLoading}
                />
            </section>

        </div>
    );
}

export default DashboardPage;
