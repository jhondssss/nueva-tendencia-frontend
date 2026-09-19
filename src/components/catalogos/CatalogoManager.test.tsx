import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import CatalogoManager from './CatalogoManager';
import type { CatalogoConfig } from './catalogosConfig';

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

const api = {
    getAll: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
};

// idKey distinto de 'id' a propósito: es lo que cambia entre las 6 entidades reales.
const config: CatalogoConfig = {
    key: 'tipos-cliente', titulo: 'Tipos de cliente', singular: 'tipo de cliente',
    idKey: 'id_tipo_cliente', api,
};

const DATA = [
    { id_tipo_cliente: 1, nombre: 'Mayorista', activo: true },
    { id_tipo_cliente: 2, nombre: 'Minorista', activo: false },
];

function error409(message: string) {
    return new AxiosError('Conflict', 'ERR_BAD_REQUEST', undefined, undefined, {
        status: 409, data: { message }, statusText: 'Conflict', headers: {}, config: {} as never,
    });
}

beforeEach(() => {
    vi.clearAllMocks();
    api.getAll.mockResolvedValue({ data: DATA });
});

describe('CatalogoManager', () => {
    it('lista los registros con su estado, leyendo el id desde idKey', async () => {
        render(<CatalogoManager config={config} />);

        expect(await screen.findByText('Mayorista')).toBeInTheDocument();
        expect(screen.getByText('Minorista')).toBeInTheDocument();
        expect(screen.getByText('Activo')).toBeInTheDocument();
        expect(screen.getByText('Inactivo')).toBeInTheDocument();
    });

    it('muestra estado vacío cuando no hay registros', async () => {
        api.getAll.mockResolvedValue({ data: [] });
        render(<CatalogoManager config={config} />);
        expect(await screen.findByText('Sin registros')).toBeInTheDocument();
    });

    it('crea un registro nuevo y lo agrega a la lista', async () => {
        api.create.mockResolvedValue({ data: { id_tipo_cliente: 3, nombre: 'Distribuidor', activo: true } });
        const user = userEvent.setup();
        render(<CatalogoManager config={config} />);
        await screen.findByText('Mayorista');

        await user.click(screen.getByRole('button', { name: /nuevo/i }));
        await user.type(screen.getByLabelText(/nombre/i), '  Distribuidor ');
        await user.click(screen.getByRole('button', { name: 'Crear' }));

        await waitFor(() => expect(api.create).toHaveBeenCalledWith('Distribuidor'));
        expect(await screen.findByText('Distribuidor')).toBeInTheDocument();
    });

    it('no envía si el nombre está vacío', async () => {
        const user = userEvent.setup();
        render(<CatalogoManager config={config} />);
        await screen.findByText('Mayorista');

        await user.click(screen.getByRole('button', { name: /nuevo/i }));
        await user.click(screen.getByRole('button', { name: 'Crear' }));

        expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument();
        expect(api.create).not.toHaveBeenCalled();
    });

    it('edita nombre y estado activo', async () => {
        api.update.mockResolvedValue({ data: { id_tipo_cliente: 1, nombre: 'Mayorista VIP', activo: false } });
        const user = userEvent.setup();
        render(<CatalogoManager config={config} />);
        await screen.findByText('Mayorista');

        await user.click(screen.getByRole('button', { name: 'Editar Mayorista' }));
        const input = screen.getByLabelText(/nombre/i);
        await user.clear(input);
        await user.type(input, 'Mayorista VIP');
        await user.click(screen.getByRole('checkbox', { name: /activo/i }));
        await user.click(screen.getByRole('button', { name: 'Actualizar' }));

        await waitFor(() => expect(api.update).toHaveBeenCalledWith(1, { nombre: 'Mayorista VIP', activo: false }));
        expect(await screen.findByText('Mayorista VIP')).toBeInTheDocument();
    });

    it('el toggle de la fila cambia solo activo', async () => {
        api.update.mockResolvedValue({ data: { id_tipo_cliente: 2, nombre: 'Minorista', activo: true } });
        const user = userEvent.setup();
        render(<CatalogoManager config={config} />);
        await screen.findByText('Minorista');

        await user.click(screen.getByRole('button', { name: 'Activar Minorista' }));

        await waitFor(() => expect(api.update).toHaveBeenCalledWith(2, { activo: true }));
    });

    it('elimina tras confirmar', async () => {
        api.remove.mockResolvedValue({});
        const user = userEvent.setup();
        render(<CatalogoManager config={config} />);
        await screen.findByText('Mayorista');

        await user.click(screen.getByRole('button', { name: 'Eliminar Mayorista' }));
        await user.click(screen.getByRole('button', { name: 'Eliminar' }));

        await waitFor(() => expect(api.remove).toHaveBeenCalledWith(1));
        await waitFor(() => expect(screen.queryByText('Mayorista')).not.toBeInTheDocument());
    });

    it('si el backend responde 409 (en uso), muestra su mensaje real y conserva el registro', async () => {
        const mensaje = 'No se puede eliminar: está en uso por 3 clientes';
        api.remove.mockRejectedValue(error409(mensaje));
        const user = userEvent.setup();
        render(<CatalogoManager config={config} />);
        await screen.findByText('Mayorista');

        await user.click(screen.getByRole('button', { name: 'Eliminar Mayorista' }));
        await user.click(screen.getByRole('button', { name: 'Eliminar' }));

        await waitFor(() => expect(toast.error).toHaveBeenCalledWith(mensaje));
        expect(screen.getByText('Mayorista')).toBeInTheDocument();
    });

    it('muestra el error del backend al crear un nombre duplicado', async () => {
        api.create.mockRejectedValue(error409('Ya existe un registro con ese nombre'));
        const user = userEvent.setup();
        render(<CatalogoManager config={config} />);
        await screen.findByText('Mayorista');

        await user.click(screen.getByRole('button', { name: /nuevo/i }));
        await user.type(screen.getByLabelText(/nombre/i), 'Mayorista');
        await user.click(screen.getByRole('button', { name: 'Crear' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('Ya existe un registro con ese nombre');
    });
});
