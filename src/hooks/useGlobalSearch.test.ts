import { act, renderHook } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { useGlobalSearch } from './useGlobalSearch';
import { searchApi } from '@/api/services';

vi.mock('@/api/services', () => ({
    searchApi: { buscar: vi.fn() },
}));

const buscarMock = vi.mocked(searchApi.buscar);

const RESULTADO: Awaited<ReturnType<typeof searchApi.buscar>> = {
    data: {
        clientes:  [{ id: 1, titulo: 'Juan Pérez', subtitulo: 'juan@correo.com' }],
        productos: [],
        pedidos:   [],
    },
} as never;

describe('useGlobalSearch', () => {
    beforeEach(() => {
        buscarMock.mockReset();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('no llama a la API con menos de 2 caracteres', async () => {
        const { result } = renderHook(() => useGlobalSearch());

        act(() => result.current.setQuery('j'));
        await act(async () => { await vi.advanceTimersByTimeAsync(500); });

        expect(buscarMock).not.toHaveBeenCalled();
        expect(result.current.hasResults).toBe(false);
    });

    it('espera ~300ms de pausa antes de pegarle a la API (debounce)', async () => {
        buscarMock.mockResolvedValue(RESULTADO);
        const { result } = renderHook(() => useGlobalSearch());

        act(() => result.current.setQuery('ju'));
        await act(async () => { await vi.advanceTimersByTimeAsync(200); });
        expect(buscarMock).not.toHaveBeenCalled();

        act(() => result.current.setQuery('juan'));
        await act(async () => { await vi.advanceTimersByTimeAsync(200); });
        expect(buscarMock).not.toHaveBeenCalled();

        await act(async () => { await vi.advanceTimersByTimeAsync(300); });
        expect(buscarMock).toHaveBeenCalledTimes(1);
        expect(buscarMock).toHaveBeenCalledWith('juan');
    });

    it('carga los resultados agrupados por categoría tras el debounce', async () => {
        buscarMock.mockResolvedValue(RESULTADO);
        const { result } = renderHook(() => useGlobalSearch());

        act(() => result.current.setQuery('juan'));
        await act(async () => { await vi.advanceTimersByTimeAsync(300); });

        expect(result.current.hasResults).toBe(true);
        expect(result.current.results.clientes).toHaveLength(1);
        expect(result.current.isLoading).toBe(false);
    });

    it('en un error de red deja resultados vacíos sin lanzar excepción', async () => {
        buscarMock.mockRejectedValue(new Error('Network Error'));
        const { result } = renderHook(() => useGlobalSearch());

        act(() => result.current.setQuery('juan'));
        await act(async () => { await vi.advanceTimersByTimeAsync(300); });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.hasResults).toBe(false);
    });

    it('reset limpia query y resultados', async () => {
        buscarMock.mockResolvedValue(RESULTADO);
        const { result } = renderHook(() => useGlobalSearch());

        act(() => result.current.setQuery('juan'));
        await act(async () => { await vi.advanceTimersByTimeAsync(300); });
        expect(result.current.hasResults).toBe(true);

        act(() => result.current.reset());

        expect(result.current.query).toBe('');
        expect(result.current.hasResults).toBe(false);
    });
});
