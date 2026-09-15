import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NTAssistant from './NTAssistant';
import { useNTAssistant } from '@/hooks/useNTAssistant';

vi.mock('@/hooks/useNTAssistant');

// jsdom no implementa matchMedia; NTAssistant lo usa para saber si está en desktop (drag del panel/burbuja).
beforeEach(() => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
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
});
