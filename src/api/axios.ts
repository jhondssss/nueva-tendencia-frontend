import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
    baseURL: 'https://nueva-tendencia-backend-production.up.railway.app',
    timeout: 15_000,
    headers: { 'Content-Type': 'application/json' },
});

// ─── Inyecta JWT en cada request ──────────────────────────────────────────────
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) config.headers.Authorization = `Bearer ${token}`;
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

        // 401 siempre redirige, independientemente del flag silent
        if (status === 401) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('nt-auth');
            toast.error('Sesión expirada. Ingresa nuevamente.');
            window.location.href = '/login';
            return Promise.reject(error);
        }

        // Si la request es silenciosa, el caller maneja su propio feedback
        if (error.config?.headers?.['x-silent']) return Promise.reject(error);

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
