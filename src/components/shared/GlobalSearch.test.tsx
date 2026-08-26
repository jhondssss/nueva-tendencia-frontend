import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import GlobalSearch from './GlobalSearch';
import { searchApi } from '@/api/services';

vi.mock('@/api/services', () => ({
    searchApi: { buscar: vi.fn() },
}));

const buscarMock = vi.mocked(searchApi.buscar);

function renderGlobalSearch() {
    return render(
        <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
                <Route path="/dashboard" element={<GlobalSearch />} />
                <Route path="/clientes" element={<div>Vista de Clientes</div>} />
                <Route path="/productos" element={<div>Vista de Productos</div>} />
                <Route path="/pedidos" element={<div>Vista de Pedidos</div>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('GlobalSearch', () => {
    beforeEach(() => {
        buscarMock.mockReset();
    });

    it('se abre con Ctrl+K y muestra el estado vacío inicial', async () => {
        const user = userEvent.setup();
        renderGlobalSearch();

        expect(screen.queryByPlaceholderText(/buscar clientes/i)).not.toBeInTheDocument();

        await user.keyboard('{Control>}k{/Control}');

        expect(await screen.findByPlaceholderText(/buscar clientes/i)).toBeInTheDocument();
        expect(screen.getByText('Escribí para buscar...')).toBeInTheDocument();
    });

    it('busca con debounce y agrupa resultados por categoría', async () => {
        buscarMock.mockResolvedValue({
            data: {
                clientes:  [{ id: 1, titulo: 'Juan Pérez', subtitulo: 'juan@correo.com' }],
                productos: [{ id: 2, titulo: 'Bota Cuero', subtitulo: 'Marca X' }],
                pedidos:   [],
            },
        } as never);

        const user = userEvent.setup();
        renderGlobalSearch();

        await user.keyboard('{Control>}k{/Control}');
        const input = await screen.findByPlaceholderText(/buscar clientes/i);

        await user.type(input, 'juan');

        expect(buscarMock).not.toHaveBeenCalled();

        await waitFor(() => expect(buscarMock).toHaveBeenCalledWith('juan'), { timeout: 2000 });
        expect(await screen.findByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('Bota Cuero')).toBeInTheDocument();
        expect(screen.getByText('Clientes')).toBeInTheDocument();
        expect(screen.getByText('Productos')).toBeInTheDocument();
    });

    it('muestra "sin resultados" cuando la búsqueda no encuentra nada', async () => {
        buscarMock.mockResolvedValue({
            data: { clientes: [], productos: [], pedidos: [] },
        } as never);

        const user = userEvent.setup();
        renderGlobalSearch();

        await user.keyboard('{Control>}k{/Control}');
        const input = await screen.findByPlaceholderText(/buscar clientes/i);
        await user.type(input, 'zzz');

        expect(await screen.findByText(/sin resultados/i, {}, { timeout: 2000 })).toBeInTheDocument();
    });

    it('al seleccionar un resultado navega a la vista correspondiente y cierra', async () => {
        buscarMock.mockResolvedValue({
            data: {
                clientes:  [{ id: 1, titulo: 'Juan Pérez', subtitulo: 'juan@correo.com' }],
                productos: [],
                pedidos:   [],
            },
        } as never);

        const user = userEvent.setup();
        renderGlobalSearch();

        await user.keyboard('{Control>}k{/Control}');
        const input = await screen.findByPlaceholderText(/buscar clientes/i);
        await user.type(input, 'juan');

        const item = await screen.findByText('Juan Pérez', {}, { timeout: 2000 });
        await user.click(item);

        expect(await screen.findByText('Vista de Clientes')).toBeInTheDocument();
        expect(screen.queryByPlaceholderText(/buscar clientes/i)).not.toBeInTheDocument();
    });
});
