import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

// Números de página com reticências: 1 … 4 5 6 … 12
function getPageItems(page, pageCount) {
    const pages = new Set([1, pageCount, page - 1, page, page + 1]);

    const sorted = [...pages]
        .filter((value) => value >= 1 && value <= pageCount)
        .sort((a, b) => a - b);

    const items = [];

    sorted.forEach((value, index) => {
        if (index > 0 && value - sorted[index - 1] > 1) {
            items.push(`gap-${value}`);
        }

        items.push(value);
    });

    return items;
}

/**
 * Rodapé de paginação das tabelas (resumo + navegação).
 * Não aparece quando todos os itens cabem em uma página.
 */
function TablePagination({ page, pageCount, total, pageSize, onPageChange, itemLabel = "registros" }) {
    if (total <= pageSize) return null;

    const first = (page - 1) * pageSize + 1;
    const last = Math.min(page * pageSize, total);

    return (
        <nav
            aria-label="Paginação"
            className="flex flex-col items-center justify-between gap-3 sm:flex-row"
        >
            <p className="text-sm text-muted-foreground">
                Mostrando <span className="font-medium text-foreground">{first}–{last}</span>{" "}
                de <span className="font-medium text-foreground">{total}</span> {itemLabel}
            </p>

            <div className="flex items-center gap-1">
                <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => onPageChange(page - 1)}
                >
                    <ChevronLeft className="size-4" />
                    Anterior
                </Button>

                {getPageItems(page, pageCount).map((item) =>
                    typeof item === "string" ? (
                        <span
                            key={item}
                            aria-hidden="true"
                            className="px-1 text-sm text-muted-foreground"
                        >
                            …
                        </span>
                    ) : (
                        <Button
                            key={item}
                            variant={item === page ? "default" : "ghost"}
                            size="sm"
                            className="min-w-8 tabular-nums"
                            aria-label={`Página ${item}`}
                            aria-current={item === page ? "page" : undefined}
                            onClick={() => onPageChange(item)}
                        >
                            {item}
                        </Button>
                    )
                )}

                <Button
                    variant="outline"
                    size="sm"
                    disabled={page === pageCount}
                    onClick={() => onPageChange(page + 1)}
                >
                    Próxima
                    <ChevronRight className="size-4" />
                </Button>
            </div>
        </nav>
    );
}

export default TablePagination;
