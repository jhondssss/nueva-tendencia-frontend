import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent, PointerEvent as ReactPointerEvent, CSSProperties } from 'react';
import { Bot, X, Minus, Send, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';
import { useNTAssistant } from '@/hooks/useNTAssistant';

const DESKTOP_QUERY = '(min-width: 640px)';
const PANEL_WIDTH = 440;
const PANEL_MARGIN = 96; // 6rem — deja espacio respecto al borde inferior de la ventana
const BUBBLE_SIZE = 64;
const BUBBLE_ANCHOR_GAP = 12;
const DRAG_THRESHOLD = 10; // px — por debajo de esto, se considera clic y no arrastre
const CLICK_MAX_DURATION = 200; // ms — gestos más cortos que esto se consideran clic aunque se haya movido el puntero

export default function NTAssistant() {
    const [open, setOpen] = useState(false);
    const [isDesktop, setIsDesktop] = useState(
        () => typeof window !== 'undefined' && window.matchMedia(DESKTOP_QUERY).matches,
    );

    // Posición del panel cuando el usuario lo arrastra (null = posición flotante por defecto)
    const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
    const dragOrigin = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

    // Posición de la burbuja cuando el usuario la arrastra (null = esquina inferior derecha por defecto)
    const [bubblePos, setBubblePos] = useState<{ x: number; y: number } | null>(null);
    const bubbleDragOrigin = useRef<{ startX: number; startY: number; origX: number; origY: number; startTime: number } | null>(null);
    const bubbleDraggedRef = useRef(false); // true si el gesto actual superó el umbral de arrastre

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef  = useRef<HTMLTextAreaElement>(null);
    const panelRef  = useRef<HTMLDivElement>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);

    const { messages, isLoading, input, setInput, sendMessage, sendQuick } = useNTAssistant();

    // Detecta cambios entre mobile/desktop para habilitar el drag solo en desktop
    useEffect(() => {
        const mq = window.matchMedia(DESKTOP_QUERY);
        const handleChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
        mq.addEventListener('change', handleChange);
        return () => mq.removeEventListener('change', handleChange);
    }, []);

    // Si la ventana cambia de tamaño, reajusta una posición arrastrada para que no quede fuera de pantalla
    useEffect(() => {
        const handleResize = () => {
            setPos(prev => {
                if (!prev || !panelRef.current) return prev;
                const { offsetWidth: w, offsetHeight: h } = panelRef.current;
                return {
                    x: Math.min(Math.max(prev.x, 0), Math.max(0, window.innerWidth - w)),
                    y: Math.min(Math.max(prev.y, 0), Math.max(0, window.innerHeight - h)),
                };
            });
            setBubblePos(prev => {
                if (!prev) return prev;
                return {
                    x: Math.min(Math.max(prev.x, 0), Math.max(0, window.innerWidth - BUBBLE_SIZE)),
                    y: Math.min(Math.max(prev.y, 0), Math.max(0, window.innerHeight - BUBBLE_SIZE)),
                };
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Libera la captura de puntero solo si sigue activa — evitar excepciones cuando
    // el navegador ya la soltó por su cuenta (p.ej. pointercancel + pointerup seguidos).
    const releasePointerSafely = (el: HTMLElement, pointerId: number) => {
        if (el.hasPointerCapture(pointerId)) el.releasePointerCapture(pointerId);
    };

    const handleDragPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!isDesktop || e.button !== 0) return;
        if ((e.target as HTMLElement).closest('button')) return; // no arrastrar al hacer click en los botones del header
        const panel = panelRef.current;
        if (!panel) return;

        const rect = panel.getBoundingClientRect();
        dragOrigin.current = { startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top };
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handleDragPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        const origin = dragOrigin.current;
        const panel = panelRef.current;
        if (!origin || !panel) return;

        const { offsetWidth: w, offsetHeight: h } = panel;
        const nextX = origin.origX + (e.clientX - origin.startX);
        const nextY = origin.origY + (e.clientY - origin.startY);

        setPos({
            x: Math.min(Math.max(nextX, 0), Math.max(0, window.innerWidth - w)),
            y: Math.min(Math.max(nextY, 0), Math.max(0, window.innerHeight - h)),
        });
    };

    // Termina el gesto de arrastre del panel en cualquier camino de salida (pointerup o
    // pointercancel): libera la captura explícitamente y limpia el origin.
    const endPanelDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
        releasePointerSafely(e.currentTarget, e.pointerId);
        dragOrigin.current = null;
    };

    // Red de seguridad: si el navegador libera la captura sin pasar por pointerup/pointercancel
    // (p.ej. el usuario cambia de pestaña o de app a mitad del arrastre), igual hay que limpiar
    // el origin — si no, un pointermove posterior sin captura real podría seguir moviendo el panel.
    const handlePanelDragLostCapture = () => {
        dragOrigin.current = null;
    };

    const panelStyle: CSSProperties | undefined = (pos && isDesktop)
        ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' }
        : undefined;

    // Calcula una posición para el panel cerca de la burbuja (cuando esta fue movida), clampeada a la ventana
    const computePanelPosFromBubble = (bp: { x: number; y: number }) => {
        const panelH = Math.min(700, window.innerHeight - PANEL_MARGIN);
        const rawX = bp.x + BUBBLE_SIZE - PANEL_WIDTH;
        const rawY = bp.y - panelH - BUBBLE_ANCHOR_GAP;
        return {
            x: Math.min(Math.max(rawX, 0), Math.max(0, window.innerWidth - PANEL_WIDTH)),
            y: Math.min(Math.max(rawY, 0), Math.max(0, window.innerHeight - panelH)),
        };
    };

    const handleBubblePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        if (!isDesktop || e.button !== 0) return;
        const bubble = bubbleRef.current;
        if (!bubble) return;

        const rect = bubble.getBoundingClientRect();
        bubbleDragOrigin.current = { startX: e.clientX, startY: e.clientY, origX: rect.left, origY: rect.top, startTime: performance.now() };
        bubbleDraggedRef.current = false;
        e.currentTarget.setPointerCapture(e.pointerId);
    };

    const handleBubblePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        const origin = bubbleDragOrigin.current;
        if (!origin) return;

        const dx = e.clientX - origin.startX;
        const dy = e.clientY - origin.startY;
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD) bubbleDraggedRef.current = true;

        const nextX = origin.origX + dx;
        const nextY = origin.origY + dy;

        setBubblePos({
            x: Math.min(Math.max(nextX, 0), Math.max(0, window.innerWidth - BUBBLE_SIZE)),
            y: Math.min(Math.max(nextY, 0), Math.max(0, window.innerHeight - BUBBLE_SIZE)),
        });
    };

    // Termina el gesto de arrastre de la burbuja en cualquier camino de salida (pointerup o
    // pointercancel): libera la captura explícitamente antes de decidir clic vs. arrastre.
    const endBubbleDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
        const origin = bubbleDragOrigin.current;
        releasePointerSafely(e.currentTarget, e.pointerId);
        if (origin) {
            // Decisión final clic vs. arrastre: combina distancia recorrida y duración del gesto.
            // Un gesto corto o con poco desplazamiento neto se trata como clic aunque el umbral
            // de distancia se haya cruzado momentáneamente durante el move (jitter de mouse/trackpad).
            const distance = Math.hypot(e.clientX - origin.startX, e.clientY - origin.startY);
            const elapsed = performance.now() - origin.startTime;
            const wasClick = distance < DRAG_THRESHOLD || elapsed < CLICK_MAX_DURATION;
            bubbleDraggedRef.current = !wasClick;
        }
        bubbleDragOrigin.current = null;
        // Si hubo un arrastre real (y el panel no está abierto ahora mismo), olvida la
        // posición fija del panel para que el próximo clic lo reubique junto a la burbuja
        if (bubbleDraggedRef.current && !open) setPos(null);
    };

    // Red de seguridad: si el navegador libera la captura sin pasar por pointerup/pointercancel
    // (p.ej. cambio de pestaña a mitad de un drag), resetea el estado para no dejar un origin
    // "vivo" que un pointermove posterior (ya sin captura real) pueda seguir usando.
    const handleBubbleLostPointerCapture = () => {
        bubbleDragOrigin.current = null;
        bubbleDraggedRef.current = false;
    };

    const handleBubbleClick = () => {
        if (bubbleDraggedRef.current) {
            bubbleDraggedRef.current = false;
            return; // fue un arrastre, no un clic: no abrir el chat
        }
        if (!open && isDesktop && bubblePos && !pos) {
            setPos(computePanelPosFromBubble(bubblePos));
        }
        setOpen(v => !v);
    };

    const bubbleStyle: CSSProperties | undefined = (bubblePos && isDesktop)
        ? { left: bubblePos.x, top: bubblePos.y, right: 'auto', bottom: 'auto' }
        : undefined;

    const SUGERENCIAS = [
        '¿Cuántos pedidos pendientes?',
        '¿Stock crítico?',
        '¿Ventas del mes?',
        '¿Pedidos por entregar hoy?',
    ];

    // Auto-scroll al último mensaje
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Focus al abrir
    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* ── Panel de chat ─────────────────────────────────────────── */}
            {open && (
                <div
                    ref={panelRef}
                    style={panelStyle}
                    className="fixed z-50 flex flex-col animate-slide-up
                               inset-3 sm:inset-auto sm:bottom-24 sm:right-6
                               sm:w-[440px] sm:max-w-[calc(100vw-3rem)]
                               sm:h-[min(700px,calc(100vh-6rem))]
                               rounded-2xl border border-border/50
                               bg-card/95 backdrop-blur-md shadow-modal overflow-hidden"
                >
                    {/* Header — arrastrable en desktop */}
                    <div
                        onPointerDown={handleDragPointerDown}
                        onPointerMove={handleDragPointerMove}
                        onPointerUp={endPanelDrag}
                        onPointerCancel={endPanelDrag}
                        onLostPointerCapture={handlePanelDragLostCapture}
                        className={clsx(
                            'flex items-center gap-2.5 px-4 py-3.5 bg-sidebar border-b border-sidebar-border flex-shrink-0',
                            isDesktop && 'cursor-grab active:cursor-grabbing touch-none select-none',
                        )}
                    >
                        <div className="w-9 h-9 rounded-lg bg-cafe-gradient flex items-center justify-center flex-shrink-0 shadow-glow-sm">
                            <Bot size={17} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-display font-semibold text-sidebar-foreground text-base leading-tight">NT Assistant</p>
                            <p className="text-xs text-sidebar-foreground/60">Asistente de Nueva Tendencia</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setOpen(false)}
                            title="Minimizar"
                            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        >
                            <Minus size={17} />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setOpen(false)}
                            title="Cerrar"
                            className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        >
                            <X size={17} />
                        </Button>
                    </div>

                    {/* Mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/30">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-4">
                                <div className="w-12 h-12 rounded-xl bg-chart-3/10 border border-chart-3/20
                                               flex items-center justify-center">
                                    <Bot size={22} className="text-chart-3" />
                                </div>
                                <p className="text-sm text-foreground font-medium">¿En qué puedo ayudarte?</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Puedo ayudarte con pedidos, clientes,<br />inventario y producción.
                                </p>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={clsx('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                            >
                                <div
                                    className={clsx(
                                        'max-w-[82%] rounded-xl px-3 py-2 text-sm leading-relaxed',
                                        msg.role === 'user'
                                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                                            : 'bg-card border border-border text-foreground rounded-bl-sm shadow-card',
                                    )}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-card border border-border rounded-xl rounded-bl-sm px-3 py-2.5 shadow-card">
                                    <Loader2 size={14} className="text-muted-foreground animate-spin" />
                                </div>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="flex-shrink-0 px-3 py-3 border-t border-border bg-card">
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                                placeholder="Escribe tu pregunta…"
                                rows={1}
                                className="input flex-1 resize-none max-h-[80px] overflow-y-auto"
                                style={{ lineHeight: '1.4' }}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || isLoading}
                                className="flex-shrink-0 p-2 rounded-lg bg-cafe-gradient text-white
                                           disabled:opacity-40 disabled:cursor-not-allowed
                                           hover:opacity-90 hover:scale-105 active:scale-95
                                           transition-all duration-200 shadow-glow-sm"
                            >
                                <Send size={15} />
                            </button>
                        </div>
                        <p className="text-2xs text-muted-foreground mt-1.5 text-center">
                            Enter para enviar · Shift+Enter para nueva línea
                        </p>

                        {/* Sugerencias rápidas */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {SUGERENCIAS.map(s => (
                                <button
                                    key={s}
                                    onClick={() => sendQuick(s)}
                                    disabled={isLoading}
                                    className="text-2xs px-2 py-1 rounded-full border border-border
                                               bg-muted/40 text-muted-foreground hover:bg-muted hover:border-primary/40 hover:text-foreground
                                               disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Botón flotante ───────────────────────────────────────── */}
            <div
                ref={bubbleRef}
                style={bubbleStyle}
                onPointerDown={handleBubblePointerDown}
                onPointerMove={handleBubblePointerMove}
                onPointerUp={endBubbleDrag}
                onPointerCancel={endBubbleDrag}
                onLostPointerCapture={handleBubbleLostPointerCapture}
                className={clsx(
                    'fixed z-50 bottom-6 right-6 w-16 h-16',
                    isDesktop && 'touch-none select-none',
                )}
            >
                {!open && (
                    <span
                        aria-hidden
                        className="absolute inset-0 rounded-full bg-cafe-400/50 animate-ping [animation-duration:2.5s] pointer-events-none"
                    />
                )}
                <button
                    onClick={handleBubbleClick}
                    className={clsx(
                        'relative w-16 h-16 rounded-full',
                        'bg-cafe-gradient shadow-glow-cafe',
                        'flex items-center justify-center',
                        'hover:opacity-90 hover:scale-105 active:scale-95 transition-all duration-200',
                        isDesktop && 'cursor-grab active:cursor-grabbing',
                        open && 'rotate-12',
                    )}
                    title="NT Assistant"
                >
                    {open
                        ? <X size={26} className="text-white" />
                        : <Bot size={26} className="text-white" />
                    }
                </button>
            </div>
        </>
    );
}
