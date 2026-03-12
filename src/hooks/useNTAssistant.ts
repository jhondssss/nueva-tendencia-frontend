import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export function useNTAssistant() {
    const [messages,  setMessages]  = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [input,     setInput]     = useState('');

    const sendMessage = useCallback(async () => {
        const text = input.trim();
        if (!text || isLoading) return;

        const updated: ChatMessage[] = [...messages, { role: 'user', content: text }];
        setMessages(updated);
        setInput('');
        setIsLoading(true);

        try {
            const res = await fetch('http://localhost:3000/assistant/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
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
    }, [input, messages, isLoading]);

    return { messages, isLoading, input, setInput, sendMessage };
}
