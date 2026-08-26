import { useState, useEffect, useMemo } from 'react';
import { searchApi } from '@/api/services';
import type { SearchResult } from '@/types';

const DEBOUNCE_MS = 300;
const LARGO_MINIMO_BUSQUEDA = 2;

const RESULTADO_VACIO: SearchResult = { clientes: [], productos: [], pedidos: [] };

export function useGlobalSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult>(RESULTADO_VACIO);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const termino = query.trim();

        if (termino.length < LARGO_MINIMO_BUSQUEDA) {
            setResults(RESULTADO_VACIO);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        const timeout = setTimeout(() => {
            searchApi.buscar(termino)
                .then(res => setResults(res.data))
                .catch(() => setResults(RESULTADO_VACIO))
                .finally(() => setIsLoading(false));
        }, DEBOUNCE_MS);

        return () => clearTimeout(timeout);
    }, [query]);

    const hasResults = useMemo(
        () => results.clientes.length > 0 || results.productos.length > 0 || results.pedidos.length > 0,
        [results],
    );

    const reset = () => {
        setQuery('');
        setResults(RESULTADO_VACIO);
    };

    return { query, setQuery, results, isLoading, hasResults, reset };
}
