import { useMemo } from "react";
import { Link } from "react-router-dom";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import {
  Activity,
  BrainCircuit,
  Calculator,
  ChartLine,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  Play,
  Target
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import IconChip from "@/components/shared/IconChip";
import MetricLabel from "@/components/shared/MetricLabel";
import SortableHead from "@/components/shared/SortableHead";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

import dataset from "@/js/data/imobpredict-dataset.json";
import { useModelTraining } from "@/hooks/useModelTraining";
import { useSort } from "@/hooks/useSort";
import {
  loadModelInfo,
  loadTrainingContext
} from "@/services/prediction/model-storage";

import { ModelDownloadCard } from "../components/ModelDownloadCard";

// =====================================================
// FORMATAÇÃO E CONSTANTES
// =====================================================

const DEFAULT_EPOCHS = 100;

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0
});

function formatMetric(value) {
  if (typeof value !== "number") return "—";

  return value.toLocaleString("pt-BR", { maximumFractionDigits: 6 });
}

// Mesma divisão usada no treinamento: 70% treino, 15% validação, resto teste.
const trainingSize = Math.floor(dataset.length * 0.7);
const validationSize = Math.floor(dataset.length * 0.15);
const testSize = dataset.length - trainingSize - validationSize;

const STATUS = {
  idle: {
    label: "Pronto para treinar",
    icon: BrainCircuit,
    tone: "bg-primary/10 text-primary"
  },
  training: {
    label: "Treinando",
    icon: LoaderCircle,
    tone: "bg-primary text-primary-foreground shadow-md shadow-primary/30",
    spin: true
  },
  completed: {
    label: "Treinamento concluído",
    icon: CheckCircle2,
    tone: "bg-primary/10 text-primary"
  },
  error: {
    label: "Falha no treinamento",
    icon: CircleAlert,
    tone: "bg-destructive/10 text-destructive"
  }
};

// =====================================================
// PROGRESSO
// =====================================================

function ProgressCard({ status, plan, latestLog, error }) {
  const { label, icon: Icon, tone, spin } = STATUS[status];

  const totalEpochs = plan?.epochs ?? DEFAULT_EPOCHS;
  const currentEpoch = latestLog?.epoch ?? 0;

  const percent =
    status === "completed"
      ? 100
      : Math.min(100, Math.round((currentEpoch / totalEpochs) * 100));

  const descriptions = {
    idle: `Usa os ${dataset.length} imóveis do dataset: ${trainingSize} para treinar, ${validationSize} para validar e ${testSize} para testar o modelo.`,
    training: `Época ${currentEpoch} de ${totalEpochs}. Mantenha esta página aberta até terminar.`,
    completed:
      "O modelo foi salvo neste navegador e registrado como nova versão. Já é possível avaliar imóveis.",
    error: error
  };

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex items-start gap-4">
          <div
            className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tone}`}
          >
            <Icon className={`size-5 ${spin ? "animate-spin" : ""}`} />
          </div>

          <div
            className="min-w-0 flex-1"
            role={status === "error" ? "alert" : "status"}
          >
            <p className="font-heading text-base font-semibold">{label}</p>

            <p className="mt-0.5 text-sm text-muted-foreground">
              {descriptions[status]}
            </p>
          </div>

          {status === "completed" && (
            <Button
              variant="outline"
              className="hidden shrink-0 sm:inline-flex"
              render={<Link to="/avaliar" />}
            >
              <Calculator className="size-4" />
              Avaliar imóvel
            </Button>
          )}
        </div>

        {(status === "training" || status === "completed") && (
          <div className="space-y-2">
            <div
              role="progressbar"
              aria-label="Progresso do treinamento"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              className="h-2 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary transition-[width] duration-300"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {status === "completed" ? totalEpochs : currentEpoch} de{" "}
                {totalEpochs} épocas
              </span>

              <span className="tabular-nums">{percent}%</span>
            </div>
          </div>
        )}

        {status === "training" && latestLog && (
          <dl className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <dt className="text-xs text-muted-foreground">Loss (treino)</dt>
              <dd className="mt-1 text-sm font-semibold">
                {formatMetric(latestLog.loss)}
              </dd>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <dt className="text-xs text-muted-foreground">
                Loss (validação)
              </dt>
              <dd className="mt-1 text-sm font-semibold">
                {formatMetric(latestLog.validationLoss)}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// RESULTADO
// =====================================================

function ResultCard({ metrics, priceRange }) {
  const maeInReais =
    metrics && priceRange
      ? metrics.mae * (priceRange.max - priceRange.min)
      : null;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <IconChip icon={Target} />
          Resultado do último treinamento
        </CardTitle>

        <CardDescription>
          Medido em dados de teste, que o modelo não viu durante o treino.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {metrics ? (
          <div className="space-y-4">
            <dl className="grid gap-3 sm:grid-cols-3">
              {[
                { name: "Loss", value: metrics.loss },
                { name: "MAE", value: metrics.mae },
                { name: "MSE", value: metrics.mse }
              ].map(({ name, value }) => (
                <div
                  key={name}
                  className="rounded-lg border bg-card p-4"
                >
                  <dt className="text-sm text-muted-foreground">
                    <MetricLabel name={name} />
                  </dt>

                  <dd className="mt-2 text-2xl font-semibold tracking-tight text-primary">
                    {formatMetric(value)}
                  </dd>
                </div>
              ))}
            </dl>

            {maeInReais !== null && (
              <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
                Em média, o modelo erra{" "}
                <strong>
                  {(metrics.mae * 100).toLocaleString("pt-BR", {
                    maximumFractionDigits: 2
                  })}
                  %
                </strong>{" "}
                da faixa de preços ({currency.format(priceRange.min)} a{" "}
                {currency.format(priceRange.max)}), ou cerca de{" "}
                <strong>{currency.format(maeInReais)}</strong> por imóvel.
              </p>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Activity className="size-5 shrink-0" />
            As métricas aparecem aqui depois do primeiro treinamento.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// EVOLUÇÃO POR ÉPOCA
// =====================================================

// Valor de cada coluna usado na ordenação.
const EPOCH_SORT = {
  epoch: (log) => log.epoch,
  loss: (log) => log.loss,
  validationLoss: (log) => log.validationLoss,
  mae: (log) => log.mae,
  validationMae: (log) => log.validationMae
};

function EvolutionCard({ epochs }) {
  // Começa pela época mais recente.
  const { sorted, sort, toggle } = useSort(epochs, EPOCH_SORT, {
    key: "epoch",
    direction: "desc"
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <IconChip icon={ChartLine} />
          Evolução do treinamento
        </CardTitle>

        <CardDescription>
          Perda a cada época, em escala logarítmica. As duas linhas devem cair
          juntas; se a de validação subir, o modelo está decorando os dados.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {epochs.length === 0 ? (
          <p className="flex h-48 items-center justify-center rounded-lg border border-dashed px-6 text-center text-sm text-muted-foreground">
            O gráfico aparece quando o treinamento começar.
          </p>
        ) : (
          <div
            className="h-64 w-full"
            role="img"
            aria-label={`Evolução da perda em ${epochs.length} épocas. Última época: treino ${formatMetric(epochs.at(-1).loss)}, validação ${formatMetric(epochs.at(-1).validationLoss)}.`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={epochs}
                margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />

                <XAxis
                  dataKey="epoch"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  tickMargin={8}
                />

                <YAxis
                  scale="log"
                  domain={["auto", "auto"]}
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={56}
                  tickFormatter={(value) =>
                    value.toLocaleString("pt-BR", {
                      maximumSignificantDigits: 1
                    })
                  }
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--popover)",
                    color: "var(--popover-foreground)",
                    fontSize: 12
                  }}
                  labelFormatter={(epoch) => `Época ${epoch}`}
                  formatter={(value, name) => [formatMetric(value), name]}
                />

                <Legend iconType="plainline" wrapperStyle={{ fontSize: 12 }} />

                <Line
                  type="monotone"
                  dataKey="loss"
                  name="Treino"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />

                <Line
                  type="monotone"
                  dataKey="validationLoss"
                  name="Validação"
                  stroke="oklch(0.666 0.179 58.318)"
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {epochs.length > 0 && (
          <details className="group rounded-lg border">
            <summary className="cursor-pointer select-none rounded-lg px-4 py-3 text-sm font-medium transition-colors hover:bg-primary/5 hover:text-primary">
              Ver registro por época ({epochs.length})
            </summary>

            <div className="max-h-72 overflow-y-auto border-t">
              <Table>
                <TableHeader>
                  <TableRow>
                    <SortableHead label="Época" sortKey="epoch" sort={sort} onSort={toggle} />
                    <SortableHead label="Loss" sortKey="loss" sort={sort} onSort={toggle} />
                    <SortableHead label="Loss (val.)" sortKey="validationLoss" sort={sort} onSort={toggle} />
                    <SortableHead label="MAE" sortKey="mae" sort={sort} onSort={toggle} />
                    <SortableHead label="MAE (val.)" sortKey="validationMae" sort={sort} onSort={toggle} />
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {sorted.map((log) => (
                    <TableRow key={log.epoch}>
                      <TableCell className="font-medium">{log.epoch}</TableCell>
                      <TableCell>{formatMetric(log.loss)}</TableCell>
                      <TableCell>{formatMetric(log.validationLoss)}</TableCell>
                      <TableCell>{formatMetric(log.mae)}</TableCell>
                      <TableCell>{formatMetric(log.validationMae)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// PÁGINA
// =====================================================

export function TrainingPage() {
  const { status, logs, result, error, plan, startTraining } =
    useModelTraining();

  const epochs = useMemo(
    () => logs.filter((log) => log.epoch !== undefined),
    [logs]
  );

  // Depois de recarregar a página, o último resultado vem do armazenamento.
  const saved = useMemo(
    // eslint-disable-next-line react-hooks/exhaustive-deps
    () => ({ info: loadModelInfo(), context: loadTrainingContext() }),
    [status]
  );

  const metrics = result?.metrics ?? saved.info?.metrics ?? null;
  const priceRange =
    (result?.trainingContext ?? saved.context)?.numericLimits?.price ?? null;

  const isTraining = status === "training";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Treinamento do modelo"
        description="Treine a rede neural com os imóveis do projeto e acompanhe o desempenho."
        actions={
          <Button onClick={startTraining} disabled={isTraining}>
            {isTraining ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Treinando...
              </>
            ) : (
              <>
                <Play className="size-4" />
                Iniciar treinamento
              </>
            )}
          </Button>
        }
      />

      <ProgressCard
        status={status}
        plan={plan}
        latestLog={epochs.at(-1)}
        error={error}
      />

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 [&>[data-slot=card]]:h-full">
          <ResultCard metrics={metrics} priceRange={priceRange} />
        </div>

        <ModelDownloadCard refreshKey={status} />
      </section>

      <EvolutionCard epochs={epochs} />
    </div>
  );
}
