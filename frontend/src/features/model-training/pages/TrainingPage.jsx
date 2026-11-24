
import { useModelTraining } from "@/hooks/useModelTraining";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  Activity,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Play,
  LoaderCircle
} from "lucide-react";

export function TrainingPage() {
  const {
    status,
    logs,
    result,
    error,
    startTraining
  } = useModelTraining();

  const latestLog = [...logs]
    .reverse()
    .find((log) => log.epoch !== undefined);

  const statusLabels = {
    idle: "Não iniciado",
    training: "Treinando",
    completed: "Concluído",
    error: "Erro"
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Treinamento do modelo
        </h1>

        <p className="text-sm text-muted-foreground">
          Gerencie o treinamento e acompanhe o desempenho da rede neural.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Status
            </CardTitle>
            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {statusLabels[status]}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Época atual
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {latestLog?.epoch ?? 0} / {100}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Amostras de treinamento
            </CardTitle>
            <BrainCircuit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>

          <CardContent>
            <div className="text-2xl font-semibold">
              {result?.trainingSamples ?? 210}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Executar treinamento</CardTitle>
          <CardDescription>
            A rede neural será treinada utilizando o conjunto de dados
            de imóveis do projeto.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button
            onClick={startTraining}
            disabled={status === "training"}
          >
            {status === "training" ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Treinando...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Iniciar treinamento
              </>
            )}
          </Button>

          {status === "training" && (
            <Badge variant="secondary">
              Treinamento em andamento
            </Badge>
          )}

          {status === "completed" && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Treinamento concluído com sucesso.
            </div>
          )}

          {status === "error" && (
            <div className="flex items-center gap-2 text-sm text-destructive">
              <CircleAlert className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados do treinamento</CardTitle>
          <CardDescription>
            Métricas calculadas ao final da execução sobre os dados de teste.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {result ? (
            <div className="grid gap-4 md:grid-cols-3">
              <Metric label="Loss" value={result.metrics.loss} />
              <Metric label="MAE" value={result.metrics.mae} />
              <Metric label="MSE" value={result.metrics.mse} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              As métricas estarão disponíveis após o treinamento.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico das épocas</CardTitle>
          <CardDescription>
            Acompanhe a evolução das métricas durante o treinamento.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="max-h-96 space-y-3 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum treinamento executado.
              </p>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className="rounded-lg border p-3 text-sm"
                >
                  {log.epoch !== undefined ? (
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
                      <span>Época: {log.epoch}</span>
                      <span>Loss: {formatMetric(log.loss)}</span>
                      <span>MAE: {formatMetric(log.mae)}</span>
                      <span>Val Loss: {formatMetric(log.valLoss)}</span>
                      <span>Val MAE: {formatMetric(log.valMae)}</span>
                    </div>
                  ) : (
                    <span>{log.message}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">
        {formatMetric(value)}
      </p>
    </div>
  );
}

function formatMetric(value) {
  if (typeof value !== "number") return "—";

  return value.toLocaleString("pt-BR", {
    maximumFractionDigits: 6
  });
}
