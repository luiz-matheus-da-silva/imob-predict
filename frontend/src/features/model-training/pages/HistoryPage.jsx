
import { useCallback, useEffect, useState } from "react";
import {
    RefreshCw,
    History as HistoryIcon,
    CheckCircle2,
    XCircle,
    Clock3,
    Loader2
} from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import SortableHead from "@/components/shared/SortableHead";
import TablePagination from "@/components/shared/TablePagination";
import TableSkeleton from "@/components/shared/TableSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import { usePagination } from "@/hooks/usePagination";
import { useSort } from "@/hooks/useSort";
import { getTrainingHistory } from "@/services/prediction/training-history.service";

function formatDate(value) {
    if (!value) return "-";

    return new Date(value).toLocaleString("pt-BR");
}

function formatMetric(value) {
    if (value === null || value === undefined) return "-";

    return Number(value).toFixed(6);
}

// Valor de cada coluna usado na ordenação.
const RUN_SORT = {
    id: (run) => Number(run.id),
    version: (run) => run.model_version ?? null,
    status: (run) => run.status,
    epochs: (run) => run.epochs,
    samples: (run) => run.training_samples,
    mae: (run) => (run.mae === null || run.mae === undefined ? null : Number(run.mae)),
    mse: (run) => (run.mse === null || run.mse === undefined ? null : Number(run.mse)),
    date: (run) => new Date(run.created_at).getTime()
};

function StatusBadge({ status }) {
    const statuses = {
        completed: {
            label: "Concluído",
            className: "bg-green-100 text-green-700",
            icon: CheckCircle2
        },
        failed: {
            label: "Falhou",
            className: "bg-red-100 text-red-700",
            icon: XCircle
        },
        running: {
            label: "Em execução",
            className: "bg-blue-100 text-blue-700",
            icon: Loader2
        },
        pending: {
            label: "Pendente",
            className: "bg-yellow-100 text-yellow-700",
            icon: Clock3
        }
    };

    const current = statuses[status] ?? {
        label: status ?? "Desconhecido",
        className: "bg-gray-100 text-gray-700",
        icon: Clock3
    };

    const Icon = current.icon;

    return (
        <Badge variant="outline" className={`gap-1.5 border-transparent ${current.className}`}>
            <Icon size={12} className={status === "running" ? "animate-spin" : ""} />
            {current.label}
        </Badge>
    );
}

export default function HistoryPage() {
    const [trainingRuns, setTrainingRuns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadHistory = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const data = await getTrainingHistory();

            setTrainingRuns(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const completedCount = trainingRuns.filter(
        item => item.status === "completed"
    ).length;

    const failedCount = trainingRuns.filter(
        item => item.status === "failed"
    ).length;

    const { sorted, sort, toggle } = useSort(trainingRuns, RUN_SORT);
    const pagination = usePagination(sorted, 10);
    const { setPage } = pagination;

    // Nova ordenação volta para a primeira página.
    useEffect(() => {
        setPage(1);
    }, [sort, setPage]);

    return (
        <div className="space-y-8">

            <PageHeader
                title="Histórico de treinamentos"
                description="Acompanhe as execuções e os resultados dos modelos."
                actions={
                    <Button
                        variant="outline"
                        onClick={loadHistory}
                        disabled={loading}
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "animate-spin" : ""}
                        />
                        Atualizar
                    </Button>
                }
            />

            {/* INDICADORES */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

                <div className="rounded-xl border bg-card p-5">
                    <p className="text-sm text-muted-foreground">
                        Total de treinamentos
                    </p>

                    {loading ? (
                        <Skeleton className="mt-2 h-9 w-16" />
                    ) : (
                        <p className="mt-2 text-3xl font-bold">
                            {trainingRuns.length}
                        </p>
                    )}
                </div>

                <div className="rounded-xl border bg-card p-5">
                    <p className="text-sm text-muted-foreground">
                        Concluídos
                    </p>

                    {loading ? (
                        <Skeleton className="mt-2 h-9 w-16" />
                    ) : (
                        <p className="mt-2 text-3xl font-bold text-green-600">
                            {completedCount}
                        </p>
                    )}
                </div>

                <div className="rounded-xl border bg-card p-5">
                    <p className="text-sm text-muted-foreground">
                        Falhas
                    </p>

                    {loading ? (
                        <Skeleton className="mt-2 h-9 w-16" />
                    ) : (
                        <p className="mt-2 text-3xl font-bold text-red-600">
                            {failedCount}
                        </p>
                    )}
                </div>
            </div>

            {/* TABELA */}
            <div className="rounded-xl border bg-card">

                <div className="border-b p-5">
                    <h2 className="font-semibold">
                        Execuções registradas
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Histórico armazenado no banco de dados.
                    </p>
                </div>

                {loading ? (
                    <div className="p-5">
                        <TableSkeleton rows={5} columns={8} label="Carregando histórico" />
                    </div>
                ) : error ? (
                    <div className="p-8 text-center">
                        <p className="text-sm text-red-600">{error}</p>

                        <button
                            onClick={loadHistory}
                            className="mt-4 text-sm font-medium underline"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : trainingRuns.length === 0 ? (
                    <div className="p-12 text-center">
                        <HistoryIcon className="mx-auto mb-3 text-muted-foreground" size={32} />

                        <p className="font-medium">
                            Nenhum treinamento encontrado
                        </p>

                        <p className="mt-1 text-sm text-muted-foreground">
                            Os treinamentos realizados aparecerão aqui.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4 p-5">
                        <div className="overflow-hidden rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <SortableHead label="Execução" sortKey="id" sort={sort} onSort={toggle} />
                                        <SortableHead label="Versão" sortKey="version" sort={sort} onSort={toggle} />
                                        <SortableHead label="Status" sortKey="status" sort={sort} onSort={toggle} />
                                        <SortableHead label="Épocas" sortKey="epochs" sort={sort} onSort={toggle} />
                                        <SortableHead label="Amostras" sortKey="samples" sort={sort} onSort={toggle} />
                                        <SortableHead label="MAE" sortKey="mae" sort={sort} onSort={toggle} />
                                        <SortableHead label="MSE" sortKey="mse" sort={sort} onSort={toggle} />
                                        <SortableHead label="Data" sortKey="date" sort={sort} onSort={toggle} />
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {pagination.pageItems.map(run => (
                                        <TableRow key={run.id}>
                                            <TableCell className="font-medium">
                                                #{run.id}
                                            </TableCell>

                                            <TableCell>
                                                {run.model_version ?? (
                                                    run.model_version_id
                                                        ? `Versão #${run.model_version_id}`
                                                        : "-"
                                                )}
                                            </TableCell>

                                            <TableCell>
                                                <StatusBadge status={run.status} />
                                            </TableCell>

                                            <TableCell>{run.epochs}</TableCell>

                                            <TableCell>{run.training_samples}</TableCell>

                                            <TableCell>{formatMetric(run.mae)}</TableCell>

                                            <TableCell>{formatMetric(run.mse)}</TableCell>

                                            <TableCell className="whitespace-nowrap text-muted-foreground">
                                                {formatDate(run.created_at)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <TablePagination
                            page={pagination.page}
                            pageCount={pagination.pageCount}
                            total={pagination.total}
                            pageSize={pagination.pageSize}
                            onPageChange={pagination.setPage}
                            itemLabel="execuções"
                        />
                    </div>
                )}
            </div>

        </div>
    );
}
