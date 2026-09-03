import { render, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import ProductImageZoom from './ProductImageZoom';

function mockHoverSupport(matches: boolean) {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
}

function loadImage(img: HTMLImageElement, w = 400, h = 300) {
    Object.defineProperty(img, 'naturalWidth', { value: w, configurable: true });
    Object.defineProperty(img, 'naturalHeight', { value: h, configurable: true });
    fireEvent.load(img);
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe('ProductImageZoom — sin soporte de hover (touch/mobile)', () => {
    beforeEach(() => mockHoverSupport(false));

    it('renderiza la imagen simple, sin lupa ni click de zoom', () => {
        const { container } = render(<ProductImageZoom src="foto.jpg" alt="Bota" className="h-48 w-full" />);
        const img = container.querySelector('img')!;
        expect(img).toHaveAttribute('src', 'foto.jpg');

        fireEvent.click(container.firstChild as Element);
        // No debe aparecer ningún elemento de lupa (sin fondo con backgroundImage)
        expect(container.querySelector('[style*="background-image"]')).toBeNull();
    });
});

describe('ProductImageZoom — con soporte de hover (desktop)', () => {
    beforeEach(() => mockHoverSupport(true));

    it('activa el modo zoom al hacer click y muestra la lupa al mover el mouse', () => {
        const { container } = render(<ProductImageZoom src="foto.jpg" alt="Bota" className="h-48 w-full" />);
        const wrapper = container.firstChild as HTMLElement;
        const img = container.querySelector('img')!;
        loadImage(img);

        vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
            left: 0, top: 0, width: 200, height: 150, right: 200, bottom: 150, x: 0, y: 0, toJSON() {},
        } as DOMRect);

        fireEvent.click(wrapper);
        fireEvent.mouseMove(wrapper, { clientX: 100, clientY: 75 });

        const lens = container.querySelector('[style*="background-image"]');
        expect(lens).not.toBeNull();
    });

    it('desactiva el zoom al hacer click de nuevo sobre la imagen', () => {
        const { container } = render(<ProductImageZoom src="foto.jpg" alt="Bota" className="h-48 w-full" />);
        const wrapper = container.firstChild as HTMLElement;
        const img = container.querySelector('img')!;
        loadImage(img);
        vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
            left: 0, top: 0, width: 200, height: 150, right: 200, bottom: 150, x: 0, y: 0, toJSON() {},
        } as DOMRect);

        fireEvent.click(wrapper);
        fireEvent.mouseMove(wrapper, { clientX: 100, clientY: 75 });
        expect(container.querySelector('[style*="background-image"]')).not.toBeNull();

        fireEvent.click(wrapper);
        expect(container.querySelector('[style*="background-image"]')).toBeNull();
    });

    it('desactiva el zoom al hacer click fuera de la imagen', () => {
        const { container } = render(
            <div>
                <ProductImageZoom src="foto.jpg" alt="Bota" className="h-48 w-full" />
                <button>afuera</button>
            </div>,
        );
        const wrapper = container.querySelector('.h-48') as HTMLElement;
        const img = container.querySelector('img')!;
        loadImage(img);
        vi.spyOn(wrapper, 'getBoundingClientRect').mockReturnValue({
            left: 0, top: 0, width: 200, height: 150, right: 200, bottom: 150, x: 0, y: 0, toJSON() {},
        } as DOMRect);

        fireEvent.click(wrapper);
        fireEvent.mouseMove(wrapper, { clientX: 100, clientY: 75 });
        expect(container.querySelector('[style*="background-image"]')).not.toBeNull();

        fireEvent.click(container.querySelector('button')!);
        expect(container.querySelector('[style*="background-image"]')).toBeNull();
    });
});
