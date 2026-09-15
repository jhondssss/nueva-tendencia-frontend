import { describe, expect, it } from 'vitest';
import { getSugerencias } from './suggestions';

describe('getSugerencias', () => {
    it('devuelve sugerencias de staff (admin/operario) por defecto', () => {
        const sugerencias = getSugerencias(false);
        expect(sugerencias).toContain('¿Stock crítico?');
        expect(sugerencias).toContain('¿Pedidos atrasados?');
        expect(sugerencias).not.toContain('¿Estado de mi pedido?');
    });

    it('devuelve sugerencias de cliente cuando isCliente es true', () => {
        const sugerencias = getSugerencias(true);
        expect(sugerencias).toContain('¿Estado de mi pedido?');
        expect(sugerencias).toContain('¿Qué productos hay disponibles?');
        expect(sugerencias).not.toContain('¿Stock crítico?');
    });
});
