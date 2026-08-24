import { useState, useCallback } from 'react';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { assistantApi } from '@/api/services';

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
            const res = await assistantApi.chat(
                text,
                currentMessages.map(m => ({ role: m.role, text: m.content })),
            );
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
        } catch (err) {
            console.error('[NT Assistant] Error completo:', err);
            if (err instanceof AxiosError) {
                const status = err.response?.status;
                if (status === 401) {
                    // El interceptor de axios ya redirige a /login y muestra el toast de sesión expirada
                } else if (status === 404) {
                    toast.error('Endpoint no encontrado en el backend');
                } else if (status && status >= 500) {
                    toast.error('Error interno del servidor');
                } else if (status) {
                    toast.error(`Error del servidor (${status})`);
                } else {
                    toast.error('No se puede conectar al backend');
                }
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
