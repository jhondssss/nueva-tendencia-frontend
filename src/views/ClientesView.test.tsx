import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ClientesView from './ClientesView';
import { useAuthStore } from '@/stores/auth.store';
import { useClienteStore } from '@/stores/index';
import { clienteApi } from '@/api/services';
import type { Cliente } from '@/types';

vi.mock('@/api/services', () => ({
    clienteApi: {
        getAll: vi.fn(),
        getOne: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        remove: vi.fn(),
        darAcceso: vi.fn(),
    },
}));

vi.mock('react-hot-toast', () => ({
    default: { error: vi.fn(), success: vi.fn() },
}));

// Cliente tal como lo devuelve realmente el backend: dirección anidada
// (relación 1:1 con DireccionCliente), no columnas planas en la raíz.
const CLIENTE_CON_DIRECCION: Cliente = {
    id_cliente: 2,
    tipo_cliente: 'persona_natural',
    nombre: 'Carlos',
    apellido: 'Rojas',
    documento_identidad: '12345678',
    correo_electronico: 'carlos@correo.com',
    telefono_principal: '70000001',
    telefono_alternativo: '70000002',
    direccion: {
        calle: 'Av. Heroínas 345',
        colonia: 'Zona Norte',
        ciudad: 'Cochabamba',
        estado_provincia: 'Cochabamba',
        codigo_postal: '0001',
        pais: 'Bolivia',
    },
    fecha_registro: '2026-01-01',
    activo: true,
};

// Los inputs de dirección no tienen <label htmlFor>, así que se consultan
// por el atributo `name` real que deja react-hook-form (register(name)).
function direccionInput(container: HTMLElement, name: string): HTMLInputElement {
    return container.querySelector(`input[name="${name}"]`) as HTMLInputElement;
}

function setAdmin() {
    useAuthStore.setState({
        user:            { id: 1, email: 'admin@nuevatendencia.com', role: 'admin' },
        token:           'token-fake',
        isAuthenticated: true,
        isLoading:       false,
        passwordChanged: false,
    });
}

function renderView() {
    return render(<MemoryRouter><ClientesView /></MemoryRouter>);
}

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    useClienteStore.setState({ clientes: [], isLoading: false });
    setAdmin();
    vi.mocked(clienteApi.getAll).mockResolvedValue({
        data: { data: [CLIENTE_CON_DIRECCION], total: 1, page: 1, limit: 30, totalPages: 1 },
    } as never);
});

describe('ClientesView — precarga del modal de edición', () => {
    it('carga los campos de dirección desde cliente.direccion (anidado), no desde columnas planas', async () => {
        const user = userEvent.setup();
        renderView();
        await screen.findByText('Carlos Rojas');

        const row = screen.getByText('Carlos Rojas').closest('tr')!;
        const editButton = row.querySelector('button[class*="hover:text-primary"]')!;
        await user.click(editButton);

        const modal = screen.getByText('Editar Cliente').closest('.modal-panel') as HTMLElement;

        // Antes del fix estos quedaban vacíos: el componente leía c.direccion_calle,
        // c.ciudad, etc. en vez de c.direccion?.calle, c.direccion?.ciudad, etc.
        expect(direccionInput(modal, 'telefono_alternativo').value).toBe('70000002');
        expect(direccionInput(modal, 'direccion_calle').value).toBe('Av. Heroínas 345');
        expect(direccionInput(modal, 'direccion_colonia').value).toBe('Zona Norte');
        expect(direccionInput(modal, 'ciudad').value).toBe('Cochabamba');
        expect(direccionInput(modal, 'estado_provincia').value).toBe('Cochabamba');
        expect(direccionInput(modal, 'codigo_postal').value).toBe('0001');
        expect(direccionInput(modal, 'pais').value).toBe('Bolivia');
    });
});

describe('ClientesView — armado del DTO al guardar', () => {
    it('envía la dirección anidada bajo `direccion`, no como campos sueltos en la raíz', async () => {
        vi.mocked(clienteApi.create).mockResolvedValue({ data: CLIENTE_CON_DIRECCION } as never);

        const user = userEvent.setup();
        renderView();
        await screen.findByText('Carlos Rojas');

        await user.click(screen.getByRole('button', { name: /nuevo cliente/i }));
        const modal = screen.getByText('Nuevo Cliente').closest('.modal-panel') as HTMLElement;

        await user.selectOptions(screen.getByRole('combobox'), 'persona_natural');
        await user.type(screen.getByPlaceholderText('Juan'), 'Ana');
        await user.type(screen.getByPlaceholderText('juan@ejemplo.com'), 'ana@correo.com');
        await user.type(screen.getByPlaceholderText('+591 70000000'), '70000003');
        await user.type(direccionInput(modal, 'direccion_calle'), 'Calle Nueva 1');
        await user.type(direccionInput(modal, 'direccion_colonia'), 'Centro');
        await user.type(direccionInput(modal, 'ciudad'), 'La Paz');
        await user.type(direccionInput(modal, 'estado_provincia'), 'La Paz');
        await user.type(direccionInput(modal, 'codigo_postal'), '1234');

        await user.click(screen.getByRole('button', { name: /registrar cliente/i }));

        await waitFor(() => expect(clienteApi.create).toHaveBeenCalledTimes(1));
        const dtoEnviado = vi.mocked(clienteApi.create).mock.calls[0][0];

        // Regresión clave: si estos campos vuelven a mandarse sueltos en la raíz
        // (direccion_calle, ciudad, ...) el backend los descarta silenciosamente
        // (ValidationPipe con whitelist:true) y la dirección nunca se guarda.
        expect(dtoEnviado).toHaveProperty('direccion');
        expect(dtoEnviado.direccion).toMatchObject({
            calle: 'Calle Nueva 1',
            colonia: 'Centro',
            ciudad: 'La Paz',
            estado_provincia: 'La Paz',
            codigo_postal: '1234',
        });
        expect(dtoEnviado).not.toHaveProperty('direccion_calle');
        expect(dtoEnviado).not.toHaveProperty('ciudad');
        expect(dtoEnviado).not.toHaveProperty('codigo_postal');
    });
});
