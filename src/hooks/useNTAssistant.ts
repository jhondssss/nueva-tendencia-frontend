import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

const ASSISTANT_URL = 'https://nueva-tendencia-backend-production.up.railway.app/assistant/chat';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export function useNTAssistant() {
    const [messages,  setMessages]  = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [input,     setInput]     = useState('');

    const send = useCallback(async (text: string, currentMessages: ChatMessage[]) => {
        const updated: ChatMessage[] = [...currentMessages, { role: 'user', content: text }];
        setMessages(updated);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch(ASSISTANT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: text,
                    history: currentMessages.map(m => ({ role: m.role, text: m.content })),
                }),
            });

            if (!res.ok) {
                console.error('[NT Assistant] HTTP error:', res.status, res.statusText);
                if (res.status === 404) {
                    toast.error('Endpoint no encontrado en el backend');
                } else if (res.status >= 500) {
                    toast.error('Error interno del servidor');
                } else {
                    toast.error(`Error del servidor (${res.status})`);
                }
                return;
            }

            const data: { response: string } = await res.json();
            setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        } catch (err) {
            console.error('[NT Assistant] Error completo:', err);
            if (err instanceof TypeError) {
                toast.error('No se puede conectar al backend');
            } else {
                toast.error('Error al comunicarse con NT Assistant.');
            }
        } finally {
            setIsLoading(false);
        }
    }, []);

    const sendMessage = useCallback(async () => {
        const text = input.trim();
        if (!text || isLoading) return;
        await send(text, messages);
    }, [input, messages, isLoading, send]);

    const sendQuick = useCallback(async (text: string) => {
        if (isLoading) return;
        await send(text, messages);
    }, [messages, isLoading, send]);

    return { messages, isLoading, input, setInput, sendMessage, sendQuick };
}
