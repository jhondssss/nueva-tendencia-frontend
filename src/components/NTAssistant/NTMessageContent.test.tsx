import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import NTMessageContent from './NTMessageContent';

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
});
