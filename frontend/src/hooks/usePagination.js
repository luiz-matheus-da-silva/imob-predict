import { useMemo, useState } from "react";

/**
 * Paginação no cliente.
 *
 * A página atual nunca passa do total: se a lista encolher (filtro,
 * exclusão), ela volta para a última página existente.
 */
export function usePagination(items, pageSize = 10) {
    const [page, setPage] = useState(1);

    const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
    const currentPage = Math.min(page, pageCount);

    const pageItems = useMemo(
        () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [items, currentPage, pageSize]
    );

    return {
        page: currentPage,
        setPage,
        pageCount,
        pageItems,
        total: items.length,
        pageSize
    };
}
