import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NTAssistant from './NTAssistant';
import { useNTAssistant } from '@/hooks/useNTAssistant';
import { useAuthStore } from '@/stores/auth.store';

vi.mock('@/hooks/useNTAssistant');

function setRole(role: 'admin' | 'operario' | 'cliente') {
    useAuthStore.setState({
        user: { id: 1, email: `${role}@nuevatendencia.com`, role },
        isAuthenticated: true, isLoading: false, passwordChanged: false,
    });
}

// jsdom no implementa matchMedia; NTAssistant lo usa para saber si está en desktop (drag del panel/burbuja).
beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    setRole('admin');
});

const useNTAssistantMock = vi.mocked(useNTAssistant);

function baseHookValue(overrides: Partial<ReturnType<typeof useNTAssistant>> = {}) {
    return {
        messages: [],
        isLoading: false,
        input: '',
        setInput: vi.fn(),
        sendMessage: vi.fn(),
        sendQuick: vi.fn(),
        ...overrides,
    };
}

describe('NTAssistant', () => {
    it('muestra el indicador de "escribiendo" mientras isLoading es true', async () => {
        useNTAssistantMock.mockReturnValue(baseHookValue({
            messages: [{ role: 'user', content: '¿Ventas del mes?' }],
            isLoading: true,
        }));

        render(<NTAssistant />);
        await userEvent.click(screen.getByTitle('NT Assistant'));

        expect(screen.getByRole('status', { name: 'NT Assistant está escribiendo' })).toBeInTheDocument();
    });

    it('no muestra el indicador cuando no está cargando', async () => {
        useNTAssistantMock.mockReturnValue(baseHookValue());

        render(<NTAssistant />);
        await userEvent.click(screen.getByTitle('NT Assistant'));

        expect(screen.queryByRole('status', { name: 'NT Assistant está escribiendo' })).not.toBeInTheDocument();
    });

    it('muestra sugerencias de staff para admin/operario', async () => {
        setRole('operario');
        useNTAssistantMock.mockReturnValue(baseHookValue());

        render(<NTAssistant />);
        await userEvent.click(screen.getByTitle('NT Assistant'));

        expect(screen.getByText('¿Stock crítico?')).toBeInTheDocument();
        expect(screen.getByText('¿Pedidos atrasados?')).toBeInTheDocument();
        expect(screen.queryByText('¿Estado de mi pedido?')).not.toBeInTheDocument();
    });

    it('muestra sugerencias de cliente cuando el rol es cliente', async () => {
        setRole('cliente');
        useNTAssistantMock.mockReturnValue(baseHookValue());

        render(<NTAssistant />);
        await userEvent.click(screen.getByTitle('NT Assistant'));

        expect(screen.getByText('¿Estado de mi pedido?')).toBeInTheDocument();
        expect(screen.getByText('¿Qué productos hay disponibles?')).toBeInTheDocument();
        expect(screen.queryByText('¿Stock crítico?')).not.toBeInTheDocument();
    });
});
