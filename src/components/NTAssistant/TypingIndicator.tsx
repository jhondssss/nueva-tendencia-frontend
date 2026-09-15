const DOT_DELAYS = ['0ms', '150ms', '300ms'];

/** Tres puntos animados que indican que el asistente está generando una respuesta. */
export default function TypingIndicator() {
    return (
        <div className="flex items-center gap-1" role="status" aria-label="NT Assistant está escribiendo">
            {DOT_DELAYS.map(delay => (
                <span
                    key={delay}
                    className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
                    style={{ animationDelay: delay }}
                />
            ))}
        </div>
    );
}
