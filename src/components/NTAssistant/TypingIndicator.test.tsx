import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import TypingIndicator from './TypingIndicator';

describe('TypingIndicator', () => {
    it('muestra un indicador accesible de "escribiendo"', () => {
        render(<TypingIndicator />);
        expect(screen.getByRole('status', { name: 'NT Assistant está escribiendo' })).toBeInTheDocument();
    });

    it('renderiza 3 puntos animados', () => {
        const { container } = render(<TypingIndicator />);
        expect(container.querySelectorAll('.animate-bounce')).toHaveLength(3);
    });
});
