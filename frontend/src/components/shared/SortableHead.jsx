import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";

import { TableHead } from "@/components/ui/table";

/**
 * Cabeçalho de coluna que ordena a tabela ao ser clicado.
 * Use com o hook `useSort`.
 */
function SortableHead({ label, sortKey, sort, onSort, className }) {
    const direction = sort?.key === sortKey ? sort.direction : null;

    const Icon =
        direction === "asc"
            ? ArrowUp
            : direction === "desc"
                ? ArrowDown
                : ChevronsUpDown;

    return (
        <TableHead
            aria-sort={
                direction === "asc"
                    ? "ascending"
                    : direction === "desc"
                        ? "descending"
                        : "none"
            }
            className={className}
        >
            <button
                type="button"
                onClick={() => onSort(sortKey)}
                className="-ml-2 inline-flex h-8 items-center gap-1.5 rounded-md px-2 font-semibold outline-none transition-colors hover:bg-primary/10 focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                {label}

                <Icon
                    className={`size-3.5 ${direction ? "opacity-100" : "opacity-40"}`}
                />
            </button>
        </TableHead>
    );
}

export default SortableHead;
