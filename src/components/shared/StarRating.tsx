import { useState } from 'react';
import { Star } from 'lucide-react';
import { clsx } from 'clsx';

interface Props {
    value:      number;
    onChange?:  (value: number) => void;
    readOnly?:  boolean;
    size?:      number;
}

export default function StarRating({ value, onChange, readOnly = false, size = 22 }: Props) {
    const [hover, setHover] = useState(0);
    const activo = hover || value;

    return (
        <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map(n => (
                <button
                    key={n}
                    type="button"
                    disabled={readOnly}
                    onClick={() => onChange?.(n)}
                    onMouseEnter={() => !readOnly && setHover(n)}
                    className={clsx('transition-transform', !readOnly && 'hover:scale-110 cursor-pointer', readOnly && 'cursor-default')}
                    aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
                >
                    <Star
                        size={size}
                        className={n <= activo ? 'fill-secondary text-secondary' : 'text-muted-foreground'}
                    />
                </button>
            ))}
        </div>
    );
}
