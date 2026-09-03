import { useEffect, useRef, useState } from 'react';
import { ZoomIn } from 'lucide-react';
import { clsx } from 'clsx';

interface ProductImageZoomProps {
    src: string;
    alt: string;
    /** Clases del contenedor: define tamaño, bordes, fondo, etc. */
    className?: string;
    /** Cómo encaja la imagen en el contenedor cuando no está en zoom. */
    fit?: 'cover' | 'contain';
    /** Factor de ampliación dentro de la lupa. */
    zoomFactor?: number;
    /** Diámetro de la lupa circular en px. */
    lensSize?: number;
}

function supportsHoverZoom(): boolean {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/**
 * Imagen de producto con lupa de zoom estilo tienda online.
 * Clic para activar/desactivar el modo zoom; mientras está activo, una lupa
 * circular sigue al cursor mostrando esa zona de la imagen ampliada.
 * En touch/mobile (sin hover de mouse) se muestra la imagen normal, sin zoom.
 */
export default function ProductImageZoom({
    src, alt, className, fit = 'cover', zoomFactor = 2.5, lensSize = 160,
}: ProductImageZoomProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [canHover] = useState(supportsHoverZoom);
    const [zoomed, setZoomed] = useState(false);
    const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
    const [lens, setLens] = useState<{ left: number; top: number; bgW: number; bgH: number; bgX: number; bgY: number } | null>(null);

    useEffect(() => {
        if (!zoomed) return;
        function handleOutsideClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setZoomed(false);
            }
        }
        document.addEventListener('click', handleOutsideClick);
        return () => document.removeEventListener('click', handleOutsideClick);
    }, [zoomed]);

    const imgFitClass = fit === 'cover' ? 'object-cover' : 'object-contain';

    if (!canHover) {
        return (
            <div className={clsx('relative overflow-hidden', className)}>
                <img src={src} alt={alt} className={clsx('w-full h-full', imgFitClass)} />
            </div>
        );
    }

    function handleClick(e: React.MouseEvent) {
        e.stopPropagation();
        setZoomed(z => !z);
    }

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        if (!zoomed || !containerRef.current || !natural) { setLens(null); return; }
        const rect = containerRef.current.getBoundingClientRect();
        const scale = fit === 'cover'
            ? Math.max(rect.width / natural.w, rect.height / natural.h)
            : Math.min(rect.width / natural.w, rect.height / natural.h);
        const renderedW = natural.w * scale;
        const renderedH = natural.h * scale;
        const offsetX = (rect.width - renderedW) / 2;
        const offsetY = (rect.height - renderedH) / 2;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Fuera del área real de la imagen (letterbox de object-contain) → ocultar lupa
        if (mouseX < offsetX || mouseX > offsetX + renderedW || mouseY < offsetY || mouseY > offsetY + renderedH) {
            setLens(null);
            return;
        }

        const rx = mouseX - offsetX;
        const ry = mouseY - offsetY;

        setLens({
            left: mouseX - lensSize / 2,
            top:  mouseY - lensSize / 2,
            bgW:  renderedW * zoomFactor,
            bgH:  renderedH * zoomFactor,
            bgX:  -(rx * zoomFactor - lensSize / 2),
            bgY:  -(ry * zoomFactor - lensSize / 2),
        });
    }

    return (
        <div
            ref={containerRef}
            className={clsx('relative overflow-hidden select-none', zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in', className)}
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={() => setLens(null)}
        >
            <img
                src={src}
                alt={alt}
                className={clsx('w-full h-full', imgFitClass)}
                onLoad={e => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            />

            {!zoomed && (
                <span className="absolute bottom-2 right-2 rounded-full bg-black/50 text-white p-1.5 pointer-events-none">
                    <ZoomIn size={14} />
                </span>
            )}

            {zoomed && lens && (
                <div
                    className="pointer-events-none absolute rounded-full border-2 border-white shadow-xl ring-1 ring-black/10"
                    style={{
                        left: lens.left,
                        top: lens.top,
                        width: lensSize,
                        height: lensSize,
                        backgroundImage: `url(${src})`,
                        backgroundRepeat: 'no-repeat',
                        backgroundSize: `${lens.bgW}px ${lens.bgH}px`,
                        backgroundPosition: `${lens.bgX}px ${lens.bgY}px`,
                    }}
                />
            )}
        </div>
    );
}
