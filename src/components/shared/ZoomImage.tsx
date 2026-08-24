import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';

/** Imagen con efecto de zoom que sigue al cursor, contenida dentro de un cuadro con overflow oculto. */
export default function ZoomImage({ src, alt }: { src: string; alt: string }) {
    const [origin, setOrigin] = useState('50% 50%');
    const [zoomed, setZoomed] = useState(false);

    function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setOrigin(`${x}% ${y}%`);
    }

    return (
        <div
            className="relative h-72 w-full overflow-hidden rounded-lg bg-muted flex items-center justify-center"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setZoomed(true)}
            onMouseLeave={() => setZoomed(false)}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    className="h-full w-full object-cover transition-transform duration-200 ease-out"
                    style={{ transformOrigin: origin, transform: zoomed ? 'scale(1.8)' : 'scale(1)' }}
                />
            ) : (
                <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            )}
        </div>
    );
}
