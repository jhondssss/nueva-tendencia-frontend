import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/auth.store';

const MUTATING_METHODS = new Set(['post', 'put', 'patch', 'delete']);

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 60_000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
});

// ─── CSRF: header requerido por el backend en toda mutación autenticada por cookie ───
api.interceptors.request.use(
    (config) => {
        if (config.method && MUTATING_METHODS.has(config.method.toLowerCase())) {
            config.headers['X-Requested-With'] = 'XMLHttpRequest';
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// ─── Manejo centralizado de errores ───────────────────────────────────────────
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message: string; statusCode: number }>) => {
        const status  = error.response?.status;
        const message = error.response?.data?.message ?? 'Error de conexión';
        const silent  = !!error.config?.headers?.['x-silent'];

        if (status === 401) {
            useAuthStore.getState().clearAuth();
            if (silent) return Promise.reject(error);
            toast.error('Sesión expirada. Ingresa nuevamente.');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // Si la request es silenciosa, el caller maneja su propio feedback
        if (silent) return Promise.reject(error);

        switch (status) {
            case 403: toast.error('Sin permisos para esta acción.'); break;
            case 404: toast.error('Recurso no encontrado.'); break;
            case 400: toast.error(Array.isArray(message) ? message.join(', ') : message); break;
            case 500: toast.error('Error interno del servidor.'); break;
            default:
                if (!error.response) toast.error('Sin conexión al servidor. ¿Está el backend activo?');
                else toast.error(message);
        }
        return Promise.reject(error);
    },
);

export default api;
