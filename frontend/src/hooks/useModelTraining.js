
import { useCallback, useRef, useState } from "react";
import { createTrainingWorker } from "@/services/prediction/training.service";

export function useModelTraining() {
  const workerRef = useRef(null);

  const [status, setStatus] = useState("idle");
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const startTraining = useCallback(() => {
    if (status === "training") {
      return;
    }

    setStatus("training");
    setLogs([]);
    setResult(null);
    setError(null);

    try {
      workerRef.current = createTrainingWorker({
        onMessage(data) {
          if (data.type === "training-started") {
            setLogs((previous) => [
              ...previous,
              { message: "Treinamento iniciado." }
            ]);
          }

          if (data.type === "training-log") {
            setLogs((previous) => [...previous, data]);
          }

          if (data.type === "training-finished") {
            setResult(data);
            setStatus("completed");
            workerRef.current = null;
          }

          if (data.type === "training-error") {
            setError(data.message);
            setStatus("error");
            workerRef.current = null;
          }
        },

        onError(trainingError) {
          setError(trainingError.message);
          setStatus("error");
          workerRef.current = null;
        }
      });

      workerRef.current.start();
    } catch (trainingError) {
      setError(trainingError.message);
      setStatus("error");
      workerRef.current = null;
    }
  }, [status]);

  return {
    status,
    logs,
    result,
    error,
    startTraining
  };
}
