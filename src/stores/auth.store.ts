import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/api/services';
import type { User, LoginDto } from '@/types';

interface AuthState {
    user:            User | null;
    token:           string | null;
    isLoading:       boolean;
    isAuthenticated: boolean;
    login:           (dto: LoginDto) => Promise<void>;
    logout:          () => void;
    clearAuth:       () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user:            null,
            token:           null,
            isLoading:       false,
            isAuthenticated: false,

            login: async (dto) => {
                set({ isLoading: true });
                try {
                    const { data } = await authApi.login(dto);
                    localStorage.setItem('access_token', data.access_token);
                    set({ token: data.access_token, user: data.user, isAuthenticated: true });
                } finally {
                    set({ isLoading: false });
                }
            },

            logout: () => {
                localStorage.removeItem('access_token');
                set({ user: null, token: null, isAuthenticated: false });
            },

            clearAuth: () => {
                localStorage.removeItem('access_token');
                localStorage.removeItem('nt-auth');
                set({ user: null, token: null, isAuthenticated: false });
            },
        }),
        {
            name: 'nt-auth',
            partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
        },
    ),
);
