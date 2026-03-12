import { useState, useMemo, useEffect } from 'react';

export interface PaginationResult<T> {
    page:       number;
    pageData:   T[];
    totalPages: number;
    goToPage:   (n: number) => void;
    nextPage:   () => void;
    prevPage:   () => void;
}

export function usePagination<T>(data: T[], pageSize: number): PaginationResult<T> {
    const [page, setPage] = useState(1);

    const totalPages = Math.max(1, Math.ceil(data.length / pageSize));

    // Resetear a página 1 cuando cambia la cantidad de elementos (búsqueda / filtros)
    useEffect(() => { setPage(1); }, [data.length]);

    const safePage = Math.min(page, totalPages);

    const pageData = useMemo(
        () => data.slice((safePage - 1) * pageSize, safePage * pageSize),
        [data, safePage, pageSize],
    );

    const goToPage = (n: number) => setPage(Math.max(1, Math.min(n, totalPages)));
    const nextPage = () => goToPage(safePage + 1);
    const prevPage = () => goToPage(safePage - 1);

    return { page: safePage, pageData, totalPages, goToPage, nextPage, prevPage };
}
