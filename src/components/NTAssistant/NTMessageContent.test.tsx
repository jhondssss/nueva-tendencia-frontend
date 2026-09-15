import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import NTMessageContent from './NTMessageContent';

function renderConRouter(content: string) {
    return render(
        <MemoryRouter initialEntries={['/dashboard']}>
            <Routes>
                <Route path="/dashboard" element={<NTMessageContent content={content} />} />
                <Route path="/pedidos" element={<p>Vista de pedidos</p>} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('NTMessageContent', () => {
    it('renderiza negritas', () => {
        render(<NTMessageContent content="Tenés **5 pedidos** pendientes." />);
        const strong = screen.getByText('5 pedidos');
        expect(strong.tagName).toBe('STRONG');
    });

    it('renderiza listas', () => {
        render(<NTMessageContent content={'Stock crítico:\n- Cuero negro\n- Suela goma'} />);
        expect(screen.getByRole('list')).toBeInTheDocument();
        expect(screen.getAllByRole('listitem')).toHaveLength(2);
        expect(screen.getByText('Cuero negro')).toBeInTheDocument();
    });

    it('convierte saltos de línea simples en <br>', () => {
        const { container } = render(<NTMessageContent content={'Línea 1\nLínea 2'} />);
        expect(container.querySelector('br')).toBeInTheDocument();
    });

    it('renderiza texto plano sin markdown', () => {
        render(<NTMessageContent content="Todo en orden." />);
        expect(screen.getByText('Todo en orden.')).toBeInTheDocument();
    });

    it('convierte un #pedido en un botón clickeable que navega a /pedidos', async () => {
        const user = userEvent.setup();
        renderConRouter('El pedido #123 está en producción.');

        const boton = screen.getByRole('button', { name: '#123' });
        await user.click(boton);

        expect(await screen.findByText('Vista de pedidos')).toBeInTheDocument();
    });

    it('detecta varios #pedido en el mismo mensaje', () => {
        renderConRouter('Tenés atrasados el #12 y el #45.');

        expect(screen.getByRole('button', { name: '#12' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '#45' })).toBeInTheDocument();
    });
});
