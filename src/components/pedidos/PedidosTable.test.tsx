import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import PedidosTable from './PedidosTable';
import type { Pedido } from '@/types';
import type { PaginationResult } from '@/hooks/usePagination';

function makePedido(overrides: Partial<Pedido> = {}): Pedido {
    return {
        id_pedido: 1,
        cliente: {
            id_cliente: 1, tipo_cliente: 'natural', nombre: 'Ana', apellido: 'Pérez',
            correo_electronico: 'ana@correo.com', telefono_principal: '70000000',
            direccion: {
                calle: 'Calle 1', colonia: 'Centro', ciudad: 'Cochabamba',
                estado_provincia: 'Cochabamba', codigo_postal: '0000', pais: 'Bolivia',
            },
            fecha_registro: '2026-01-01', activo: true,
        },
        producto: {
            id_producto: 1, nombre_modelo: 'Bota clásica', marca: 'NT', tipo_calzado: 'bota',
            genero: 'unisex', material_principal: 'cuero', color: 'negro', precio_venta: 100,
            costo_unidad: 50, descripcion_corta: '', activo: true, stock: 10,
            unidad_medida: 'par', nivel_minimo: 2,
        },
        cantidad: 1, unidad: 'par', cantidad_pares: 1, total: 100,
        fecha_entrega: '2026-12-01', estado: 'Aparado',
        ...overrides,
    };
}

function makePagination(data: Pedido[]): PaginationResult<Pedido> {
    return {
        page: 1, pageData: data, totalPages: 1,
        goToPage: vi.fn(), nextPage: vi.fn(), prevPage: vi.fn(),
    };
}

function renderTable(pedidos: Pedido[], overrides: { canEdit?: boolean; canDelete?: boolean } = {}) {
    const onMover = vi.fn();
    render(
        <PedidosTable
            onEdit={vi.fn()}
            onDelete={vi.fn()}
            onMover={onMover}
            canEdit={overrides.canEdit ?? true}
            canDelete={overrides.canDelete ?? true}
            isLoading={false}
            pagination={makePagination(pedidos)}
            total={pedidos.length}
        />,
    );
    return { onMover };
}

describe('PedidosTable — render por estado', () => {
    it('muestra el badge de estado correcto para pedidos en distintos estados', () => {
        const pedidos = [
            makePedido({ id_pedido: 1, estado: 'Pendiente' }),
            makePedido({ id_pedido: 2, estado: 'Aparado' }),
            makePedido({ id_pedido: 3, estado: 'Terminado' }),
        ];
        renderTable(pedidos);

        expect(screen.getByText('#1').closest('tr')).toHaveTextContent('Pendiente');
        expect(screen.getByText('#2').closest('tr')).toHaveTextContent('Aparado');
        expect(screen.getByText('#3').closest('tr')).toHaveTextContent('Terminado');
    });
});

describe('PedidosTable — transición de estado ("Siguiente etapa")', () => {
    it('el botón siempre ofrece el estado inmediato siguiente, nunca uno salteado', () => {
        renderTable([makePedido({ id_pedido: 10, estado: 'Aparado' })]);

        expect(screen.getByRole('button', { name: /solado/i })).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /empaque/i })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /terminado/i })).not.toBeInTheDocument();
    });

    it('click en "Siguiente etapa" dispara onMover con el id y el siguiente estado (transición válida)', async () => {
        const user = userEvent.setup();
        const { onMover } = renderTable([makePedido({ id_pedido: 10, estado: 'Aparado' })]);

        await user.click(screen.getByRole('button', { name: /solado/i }));

        expect(onMover).toHaveBeenCalledTimes(1);
        expect(onMover).toHaveBeenCalledWith(10, 'Solado');
    });

    it('un pedido Terminado no ofrece ningún botón de transición', () => {
        renderTable([makePedido({ id_pedido: 11, estado: 'Terminado' })]);

        expect(screen.getByText('Completado')).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: /pendiente|cortado|aparado|solado|empaque|terminado/i }),
        ).not.toBeInTheDocument();
    });

    it('operario (canEdit=false) también puede disparar la transición — "mover" no está restringido por rol en la UI, igual que en el backend (@Roles(admin, operario) en PATCH /pedidos/:id/mover)', async () => {
        const user = userEvent.setup();
        const { onMover } = renderTable(
            [makePedido({ id_pedido: 12, estado: 'Cortado' })],
            { canEdit: false, canDelete: false },
        );

        await user.click(screen.getByRole('button', { name: /aparado/i }));

        expect(onMover).toHaveBeenCalledWith(12, 'Aparado');
    });
});
