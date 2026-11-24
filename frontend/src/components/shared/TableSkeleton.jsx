import { Skeleton } from "@/components/ui/skeleton";

/**
 * Esqueleto de tabela exibido enquanto os dados carregam.
 * O rótulo fica disponível para leitores de tela.
 */
function TableSkeleton({ rows = 5, columns = 6, label = "Carregando dados" }) {
    return (
        <div role="status" aria-busy="true" className="space-y-3">
            <span className="sr-only">{label}...</span>

            {/* Cabeçalho */}
            <div
                className="grid gap-4 border-b pb-3"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
            >
                {Array.from({ length: columns }, (_, column) => (
                    <Skeleton key={column} className="h-3 w-2/3" />
                ))}
            </div>

            {/* Linhas */}
            {Array.from({ length: rows }, (_, row) => (
                <div
                    key={row}
                    className="grid items-center gap-4 border-b pb-3 last:border-0"
                    style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                >
                    {Array.from({ length: columns }, (_, column) => (
                        <Skeleton
                            key={column}
                            className={`h-4 ${column === 0 ? "w-1/2" : "w-5/6"}`}
                        />
                    ))}
                </div>
            ))}
        </div>
    );
}

export default TableSkeleton;
