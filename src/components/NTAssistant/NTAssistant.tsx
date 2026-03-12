import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useNTAssistant } from '@/hooks/useNTAssistant';

// ─── Constantes de layout ─────────────────────────────────────────────────────

const BTN_SIZE = 48;
const PANEL_W  = 350;
const PANEL_H  = 500;
const GAP      = 8;

// ─────────────────────────────────────────────────────────────────────────────

export default function NTAssistant() {
    const [open, setOpen] = useState(false);

    // Posición del botón (left / top en px, inicializada a bottom-right)
    const [pos, setPos] = useState(() => ({
        x: window.innerWidth  - 24 - BTN_SIZE,
        y: window.innerHeight - 24 - BTN_SIZE,
    }));

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef  = useRef<HTMLTextAreaElement>(null);

    // Estado de drag en refs → no necesita re-render
    const isDragging = useRef(false);
    const hasMoved   = useRef(false);
    const dragStart  = useRef({ mouseX: 0, mouseY: 0, btnX: 0, btnY: 0 });

    const { messages, isLoading, input, setInput, sendMessage } = useNTAssistant();

    // Auto-scroll al último mensaje
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Focus al abrir
    useEffect(() => {
        if (open) inputRef.current?.focus();
    }, [open]);

    // ── Listeners de drag en window ───────────────────────────────────────────

    useEffect(() => {
        const onMouseMove = (e: MouseEvent) => {
            if (!isDragging.current) return;

            const dx = e.clientX - dragStart.current.mouseX;
            const dy = e.clientY - dragStart.current.mouseY;

            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                hasMoved.current = true;
            }

            const newX = Math.min(
                Math.max(0, dragStart.current.btnX + dx),
                window.innerWidth - BTN_SIZE,
            );
            const newY = Math.min(
                Math.max(0, dragStart.current.btnY + dy),
                window.innerHeight - BTN_SIZE,
            );

            setPos({ x: newX, y: newY });
        };

        const onMouseUp = () => {
            if (!isDragging.current) return;
            isDragging.current         = false;
            document.body.style.userSelect = '';
            if (!hasMoved.current) setOpen(v => !v);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup',   onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup',   onMouseUp);
        };
    }, []);

    // ── Handler mousedown del botón ───────────────────────────────────────────

    const onMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        hasMoved.current   = false;
        dragStart.current  = {
            mouseX: e.clientX,
            mouseY: e.clientY,
            btnX:   pos.x,
            btnY:   pos.y,
        };
        document.body.style.userSelect = 'none';
    };

    // ── Posición del panel: arriba del botón, o abajo si no hay espacio ───────

    const panelLeft = Math.min(
        Math.max(GAP, pos.x - (PANEL_W - BTN_SIZE)),
        window.innerWidth - PANEL_W - GAP,
    );
    const panelTop = pos.y - PANEL_H - GAP >= GAP
        ? pos.y - PANEL_H - GAP
        : pos.y + BTN_SIZE + GAP;

    // ─────────────────────────────────────────────────────────────────────────

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
                    style={{ left: panelLeft, top: panelTop, width: PANEL_W }}
                    className="fixed z-50 flex flex-col animate-slide-up
                               h-[500px] rounded-xl border border-surface-border
                               bg-white shadow-modal overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-cafe-900 border-b border-cafe-800 flex-shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-cafe-gradient flex items-center justify-center flex-shrink-0 shadow-glow-sm">
                            <Bot size={14} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-display font-semibold text-white text-sm leading-tight">NT Assistant</p>
                            <p className="text-2xs text-cafe-200">Asistente de Nueva Tendencia</p>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="p-1 rounded text-cafe-300 hover:text-white hover:bg-cafe-800 transition-colors"
                        >
                            <X size={15} />
                        </button>
                    </div>

                    {/* Mensajes */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-crema">
                        {messages.length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center gap-3 text-center px-4">
                                <div className="w-12 h-12 rounded-xl bg-dorado-500/10 border border-dorado-500/20
                                               flex items-center justify-center">
                                    <Bot size={22} className="text-dorado-600" />
                                </div>
                                <p className="text-sm text-cafe-800 font-medium">¿En qué puedo ayudarte?</p>
                                <p className="text-xs text-cafe-400 leading-relaxed">
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
                                            ? 'bg-cafe-900 text-white rounded-br-sm'
                                            : 'bg-white border border-surface-border text-cafe-800 rounded-bl-sm shadow-card',
                                    )}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-surface-border rounded-xl rounded-bl-sm px-3 py-2.5 shadow-card">
                                    <Loader2 size={14} className="text-cafe-500 animate-spin" />
                                </div>
                            </div>
                        )}

                        <div ref={bottomRef} />
                    </div>

                    {/* Input */}
                    <div className="flex-shrink-0 px-3 py-3 border-t border-surface-border bg-white">
                        <div className="flex items-end gap-2">
                            <textarea
                                ref={inputRef}
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                                placeholder="Escribe tu pregunta…"
                                rows={1}
                                className="flex-1 resize-none bg-crema border border-surface-border rounded-lg
                                           px-3 py-2 text-sm text-cafe-950 placeholder-cafe-300
                                           focus:outline-none focus:border-cafe-500 focus:ring-1 focus:ring-cafe-500/30
                                           disabled:opacity-50 transition-colors
                                           max-h-[80px] overflow-y-auto"
                                style={{ lineHeight: '1.4' }}
                            />
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || isLoading}
                                className="flex-shrink-0 p-2 rounded-lg bg-cafe-gradient text-white
                                           disabled:opacity-40 disabled:cursor-not-allowed
                                           hover:opacity-90 transition-opacity shadow-glow-sm"
                            >
                                <Send size={15} />
                            </button>
                        </div>
                        <p className="text-2xs text-cafe-400 mt-1.5 text-center">
                            Enter para enviar · Shift+Enter para nueva línea
                        </p>
                    </div>
                </div>
            )}

            {/* ── Botón flotante (draggable) ─────────────────────────────── */}
            <button
                onMouseDown={onMouseDown}
                style={{ left: pos.x, top: pos.y, width: BTN_SIZE, height: BTN_SIZE }}
                className={clsx(
                    'fixed z-50 rounded-full',
                    'cursor-grab active:cursor-grabbing',
                    'bg-cafe-gradient shadow-glow-cafe',
                    'flex items-center justify-center',
                    'hover:opacity-90 transition-all duration-200',
                    open && 'rotate-12 scale-95',
                )}
                title="NT Assistant"
            >
                {open
                    ? <X size={20} className="text-white" />
                    : <Bot size={20} className="text-white" />
                }
            </button>
        </>
    );
}
