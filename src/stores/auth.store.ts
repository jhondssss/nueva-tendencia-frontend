import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/api/services';
import type { User, LoginDto } from '@/types';

interface AuthState {
    user:                User | null;
    token:               string | null;
    isLoading:           boolean;
    isAuthenticated:     boolean;
    /** true tras completar /auth/cambiar-password-inicial en esta sesión (el JWT vigente no se reemite, así que el flag original queda obsoleto). */
    passwordChanged:     boolean;
    login:               (dto: LoginDto) => Promise<void>;
    logout:              () => void;
    clearAuth:           () => void;
    markPasswordChanged: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user:            null,
            token:           null,
            isLoading:       false,
            isAuthenticated: false,
            passwordChanged: false,

            login: async (dto) => {
                set({ isLoading: true });
                try {
                    const { data } = await authApi.login(dto);
                    localStorage.setItem('access_token', data.access_token);
                    set({ token: data.access_token, user: data.user, isAuthenticated: true, passwordChanged: false });
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: () => {
                localStorage.removeItem('access_token');
                set({ user: null, token: null, isAuthenticated: false, passwordChanged: false });
            },

            clearAuth: () => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('nt-auth');
                set({ user: null, token: null, isAuthenticated: false, passwordChanged: false });
            },

            markPasswordChanged: () => set({ passwordChanged: true }),
        }),
        {
            name: 'nt-auth',
            partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
        },
    ),
);
