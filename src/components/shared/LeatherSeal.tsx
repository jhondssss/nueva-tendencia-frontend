import { clsx } from 'clsx';

interface LeatherSealProps {
    /** sm = marca compacta (sidebar/header), md = indicador de carga, lg = pantalla de login */
    size?: 'sm' | 'md' | 'lg';
    /** Anima la entrada (fade + zoom), pensado para pantallas que se ven una vez por sesión */
    animated?: boolean;
    /** Pulso sutil en el anillo decorativo, para estados de carga */
    pulse?: boolean;
    className?: string;
}

const SIZE_MAP = {
    sm: { outer: 'w-8 h-8',   inner: 'w-8 h-8',   text: 'text-sm',  ring: false, innerRing: 'ring-2 ring-cafe-950/30', shadow: 'shadow-glow-sm' },
    md: { outer: 'w-14 h-14', inner: 'w-11 h-11', text: 'text-sm',  ring: true,  innerRing: 'ring-4 ring-cafe-950/40', shadow: 'shadow-glow-cafe' },
    lg: { outer: 'w-20 h-20', inner: 'w-14 h-14', text: 'text-xl', ring: true,  innerRing: 'ring-4 ring-cafe-950/40', shadow: 'shadow-glow-cafe' },
} as const;

/** Sello de marca "Nueva Tendencia" — mismo motivo visual del LoginView, reutilizable en toda la app. */
export default function LeatherSeal({ size = 'md', animated = false, pulse = false, className }: LeatherSealProps) {
    const s = SIZE_MAP[size];
    return (
        <div className={clsx(
            'relative inline-flex items-center justify-center flex-shrink-0',
            s.outer,
            animated && 'animate-in fade-in zoom-in-50 duration-500',
            className,
        )}>
            {s.ring && (
                <>
                    <div className={clsx('absolute inset-0 rounded-full border-2 border-dorado-400/70', pulse && 'animate-pulse')} />
                    <div className="absolute inset-[5px] rounded-full border border-dashed border-dorado-300/40" />
                </>
            )}
            <div className={clsx(
                'relative rounded-full bg-cafe-gradient flex items-center justify-center',
                s.inner, s.innerRing, s.shadow,
            )}>
                <span className={clsx('font-display font-bold text-dorado-100 tracking-wide', s.text)}>NT</span>
            </div>
        </div>
    );
}
