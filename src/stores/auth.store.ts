import { create } from 'zustand';
import { authApi } from '@/api/services';
import type { User, LoginDto, UpdatePerfilDto } from '@/types';

interface AuthState {
    user:                User | null;
    isLoading:           boolean;
    isAuthenticated:     boolean;
    /** false hasta que checkSession() resuelve una vez al cargar la app. */
    isInitialized:       boolean;
    /** true tras completar /auth/cambiar-password-inicial en esta sesión (el JWT vigente no se reemite, así que el flag original queda obsoleto). */
    passwordChanged:     boolean;
    login:               (dto: LoginDto) => Promise<void>;
    logout:              () => Promise<void>;
    checkSession:        () => Promise<void>;
    clearAuth:           () => void;
    markPasswordChanged: () => void;
    /** Guarda el perfil propio y refresca `user` en el store con la respuesta (sin F5). */
    updatePerfil:        (dto: UpdatePerfilDto) => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set) => ({
    user:            null,
    isLoading:       false,
    isAuthenticated: false,
    isInitialized:   false,
    passwordChanged: false,

    login: async (dto) => {
        set({ isLoading: true });
        try {
            await authApi.login(dto);
            const { data: user } = await authApi.me();
            set({ user, isAuthenticated: true, passwordChanged: false });
        } finally {
            set({ isLoading: false });
        }
    },

    logout: async () => {
        try {
            await authApi.logout();
        } catch {
            // el usuario se desloguea del lado del cliente aunque falle la llamada al backend
        } finally {
            set({ user: null, isAuthenticated: false, passwordChanged: false });
        }
    },

    /** Determina si hay sesión activa vía cookie httpOnly. Se llama una vez al cargar la app. */
    checkSession: async () => {
        try {
            const { data: user } = await authApi.me();
            set({ user, isAuthenticated: true });
        } catch {
            set({ user: null, isAuthenticated: false });
        } finally {
            set({ isInitialized: true });
        }
    },

    clearAuth: () => set({ user: null, isAuthenticated: false, passwordChanged: false }),

    markPasswordChanged: () => set({ passwordChanged: true }),

    updatePerfil: async (dto) => {
        // Si el email cambió, el backend ya reemitió la cookie httpOnly; acá solo se sincroniza el estado local.
        const { data } = await authApi.updatePerfil(dto);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { access_token, ...user } = data;
        set(state => ({ user: { ...state.user, ...user } }));
    },
}));
