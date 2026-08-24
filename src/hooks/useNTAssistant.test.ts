import { act, renderHook, waitFor } from '@testing-library/react';
import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import toast from 'react-hot-toast';
import { useNTAssistant } from './useNTAssistant';
import { assistantApi } from '@/api/services';

vi.mock('@/api/services', () => ({
    assistantApi: { chat: vi.fn() },
}));

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

const chatMock = vi.mocked(assistantApi.chat);

function axiosErrorConStatus(status: number) {
    return new AxiosError('Request failed', undefined, undefined, undefined, {
        status,
        statusText: 'Error',
        data: {},
        headers: {},
        config: {} as never,
    });
}

describe('useNTAssistant', () => {
    beforeEach(() => {
        chatMock.mockReset();
        vi.mocked(toast.error).mockClear();
    });

    it('pasa por assistantApi (axios con Bearer token) y agrega la respuesta del asistente', async () => {
        chatMock.mockResolvedValueOnce({ data: { response: 'Tenés 5 pedidos pendientes.' } } as never);

        const { result } = renderHook(() => useNTAssistant());

        act(() => result.current.setInput('¿Cuántos pedidos pendientes?'));
        await act(async () => { await result.current.sendMessage(); });

        expect(chatMock).toHaveBeenCalledWith('¿Cuántos pedidos pendientes?', []);
        expect(result.current.messages).toEqual([
            { role: 'user', content: '¿Cuántos pedidos pendientes?' },
            { role: 'assistant', content: 'Tenés 5 pedidos pendientes.' },
        ]);
        expect(result.current.isLoading).toBe(false);
    });

    it('en un 401 no duplica el toast: lo maneja el interceptor global de axios', async () => {
        chatMock.mockRejectedValueOnce(axiosErrorConStatus(401));

        const { result } = renderHook(() => useNTAssistant());
        act(() => result.current.setInput('¿Ventas del mes?'));
        await act(async () => { await result.current.sendMessage(); });

        expect(toast.error).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
    });

    it('en un 404 avisa que el endpoint no existe en el backend', async () => {
        chatMock.mockRejectedValueOnce(axiosErrorConStatus(404));

        const { result } = renderHook(() => useNTAssistant());
        act(() => result.current.setInput('¿Stock crítico?'));
        await act(async () => { await result.current.sendMessage(); });

        expect(toast.error).toHaveBeenCalledWith('Endpoint no encontrado en el backend');
    });

    it('en un 500 avisa error interno del servidor', async () => {
        chatMock.mockRejectedValueOnce(axiosErrorConStatus(500));

        const { result } = renderHook(() => useNTAssistant());
        act(() => result.current.setInput('¿Pedidos por entregar hoy?'));
        await act(async () => { await result.current.sendMessage(); });

        expect(toast.error).toHaveBeenCalledWith('Error interno del servidor');
    });

    it('sin response (error de red) avisa que no se puede conectar al backend', async () => {
        chatMock.mockRejectedValueOnce(new AxiosError('Network Error'));

        const { result } = renderHook(() => useNTAssistant());
        act(() => result.current.setInput('¿Ventas del mes?'));
        await act(async () => { await result.current.sendMessage(); });

        expect(toast.error).toHaveBeenCalledWith('No se puede conectar al backend');
    });

    it('sendQuick manda la sugerencia sin pasar por el input controlado', async () => {
        chatMock.mockResolvedValueOnce({ data: { response: 'Stock OK' } } as never);

        const { result } = renderHook(() => useNTAssistant());
        await act(async () => { await result.current.sendQuick('¿Stock crítico?'); });

        await waitFor(() => expect(result.current.messages).toHaveLength(2));
        expect(chatMock).toHaveBeenCalledWith('¿Stock crítico?', []);
    });
});
