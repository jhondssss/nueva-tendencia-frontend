import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Bot, X, Send, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';
import { useNTAssistant } from '@/hooks/useNTAssistant';

export default function NTAssistant() {
    const [open, setOpen] = useState(false);

    const bottomRef = useRef<HTMLDivElement>(null);
    const inputRef  = useRef<HTMLTextAreaElement>(null);

    const { messages, isLoading, input, setInput, sendMessage, sendQuick } = useNTAssistant();

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
                    className="fixed z-50 bottom-24 right-6 flex flex-col animate-slide-up
                               w-[350px] max-w-[calc(100vw-3rem)]
                               max-h-[min(600px,calc(100vh-7rem))]
                               rounded-xl border border-border/50
                               bg-card/95 backdrop-blur-md shadow-modal overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center gap-2.5 px-4 py-3 bg-sidebar border-b border-sidebar-border flex-shrink-0">
                        <div className="w-7 h-7 rounded-lg bg-cafe-gradient flex items-center justify-center flex-shrink-0 shadow-glow-sm">
                            <Bot size={14} className="text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-display font-semibold text-sidebar-foreground text-sm leading-tight">NT Assistant</p>
                            <p className="text-2xs text-sidebar-foreground/60">Asistente de Nueva Tendencia</p>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setOpen(false)}
                            className="h-7 w-7 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                        >
                            <X size={15} />
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
            <button
                onClick={() => setOpen(v => !v)}
                className={clsx(
                    'fixed z-50 bottom-6 right-6 w-12 h-12 rounded-full',
                    'bg-cafe-gradient shadow-glow-cafe',
                    'flex items-center justify-center',
                    'hover:opacity-90 hover:scale-105 active:scale-95 transition-all duration-200',
                    open && 'rotate-12',
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
