import { useMemo, useState } from "react";

function isEmpty(value) {
    return value === null || value === undefined || Number.isNaN(value);
}

function compare(a, b) {
    if (typeof a === "string" || typeof b === "string") {
        return String(a).localeCompare(String(b), "pt-BR", {
            numeric: true,
            sensitivity: "base"
        });
    }

    return a - b;
}

/**
 * Ordenação de tabelas no cliente.
 *
 * Cada clique na coluna alterna: crescente → decrescente → ordem original.
 * Valores vazios ficam sempre no final.
 *
 * @param {Array} items Linhas da tabela.
 * @param {Object<string, (item: any) => any>} accessors Função que extrai o valor
 *   de cada coluna (defina fora do componente, ou memorize, para manter estável).
 * @param {{ key: string, direction: "asc" | "desc" } | null} [initial]
 */
export function useSort(items, accessors, initial = null) {
    const [sort, setSort] = useState(initial);

    const sorted = useMemo(() => {
        const accessor = sort && accessors[sort.key];

        if (!accessor) return items;

        const direction = sort.direction === "asc" ? 1 : -1;

        return [...items].sort((a, b) => {
            const valueA = accessor(a);
            const valueB = accessor(b);

            if (isEmpty(valueA) && isEmpty(valueB)) return 0;
            if (isEmpty(valueA)) return 1;
            if (isEmpty(valueB)) return -1;

            return compare(valueA, valueB) * direction;
        });
    }, [items, sort, accessors]);

    function toggle(key) {
        setSort((current) => {
            if (!current || current.key !== key) {
                return { key, direction: "asc" };
            }

            return current.direction === "asc"
                ? { key, direction: "desc" }
                : null;
        });
    }

    return { sorted, sort, toggle };
}
