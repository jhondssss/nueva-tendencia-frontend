import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
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

    it('convierte una URL de reporte PDF en un botón de descarga', () => {
        render(
            <NTMessageContent
                content="Aquí tienes tu reporte: https://api.nueva-tendencia.com/reportes/pdf/ventas?year=2026"
            />,
        );

        const boton = screen.getByRole('button', { name: /Descargar: Reporte de ventas/ });
        expect(boton).toBeInTheDocument();
        expect(screen.queryByText(/https:\/\//)).not.toBeInTheDocument();
    });

    it('detecta URL de reporte Excel y no rompe la puntuación de la frase', () => {
        render(
            <NTMessageContent
                content="Tu reporte de kardex está listo: https://api.nueva-tendencia.com/reportes/excel/kardex?desde=2026-09-01."
            />,
        );

        expect(screen.getByRole('button', { name: /Descargar: Reporte de kardex/ })).toBeInTheDocument();
    });

    it('al hacer clic en el botón de reporte abre la URL en una pestaña nueva', async () => {
        const user = userEvent.setup();
        const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

        render(
            <NTMessageContent
                content="https://api.nueva-tendencia.com/reportes/pdf/stock"
            />,
        );

        await user.click(screen.getByRole('button', { name: /Descargar: Reporte de stock/ }));

        expect(openSpy).toHaveBeenCalledWith(
            'https://api.nueva-tendencia.com/reportes/pdf/stock',
            '_blank',
            'noopener,noreferrer',
        );

        openSpy.mockRestore();
    });
});
