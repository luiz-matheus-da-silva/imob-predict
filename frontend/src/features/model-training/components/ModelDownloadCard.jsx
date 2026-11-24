import { useEffect, useState } from "react";

import {
  CircleAlert,
  CheckCircle2,
  Download,
  PackageOpen
} from "lucide-react";

import IconChip from "@/components/shared/IconChip";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import { getModelStatus } from "@/services/prediction/prediction.service";
import { downloadTrainedModel } from "@/services/prediction/model-export.service";

function formatDate(value) {
  return value
    ? new Date(value).toLocaleString("pt-BR", {
        dateStyle: "short",
        timeStyle: "short"
      })
    : "—";
}

/**
 * Modelo salvo neste navegador, disponível para download.
 *
 * `refreshKey` deve mudar quando um novo treinamento termina,
 * para que o cartão mostre o modelo mais recente. As métricas ficam
 * em "Resultado do último treinamento", sem repetição aqui.
 */
export function ModelDownloadCard({ refreshKey }) {
  const [model, setModel] = useState({ state: "checking" });
  const [isDownloading, setIsDownloading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  useEffect(() => {
    let cancelled = false;

    setModel({ state: "checking" });

    getModelStatus()
      .then((status) => {
        if (cancelled) return;

        setModel(
          status.ready
            ? { state: "ready", info: status.info }
            : { state: "missing" }
        );
      })
      .catch(() => {
        if (!cancelled) setModel({ state: "missing" });
      });

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  async function handleDownload() {
    setIsDownloading(true);
    setFeedback(null);

    try {
      const fileName = await downloadTrainedModel();

      setFeedback({
        type: "success",
        message: `Arquivo ${fileName} gerado.`
      });
    } catch (error) {
      setFeedback({ type: "error", message: error.message });
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <IconChip icon={Download} />
          Modelo salvo
        </CardTitle>

        <CardDescription>
          Pesos e contexto de normalização em um único arquivo.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {model.state === "checking" && (
          <div role="status" aria-busy="true" className="space-y-3">
            <span className="sr-only">Verificando modelo salvo...</span>
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
        )}

        {model.state === "missing" && (
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <PackageOpen className="mt-0.5 size-5 shrink-0" />
            Nenhum modelo treinado ainda. Execute um treinamento para
            liberar o download.
          </div>
        )}

        {model.state === "ready" && (
          <>
            <p className="text-sm text-muted-foreground">
              Treinado em{" "}
              <span className="font-medium text-foreground">
                {formatDate(model.info?.trainedAt)}
              </span>
            </p>

            <Button
              variant="outline"
              className="w-full"
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download className="size-4" />
              {isDownloading ? "Gerando arquivo..." : "Baixar modelo (.json)"}
            </Button>

            {feedback && (
              <p
                role={feedback.type === "error" ? "alert" : "status"}
                className={`flex items-start gap-2 text-sm ${
                  feedback.type === "error"
                    ? "text-destructive"
                    : "text-emerald-700"
                }`}
              >
                {feedback.type === "error" ? (
                  <CircleAlert className="mt-0.5 size-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                )}

                {feedback.message}
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
