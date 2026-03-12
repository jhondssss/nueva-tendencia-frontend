import { useAuthStore } from '@/stores/auth.store';

export function useRole() {
    const role = useAuthStore(s => s.user?.role);

    const isAdmin    = role === 'admin';
    const isOperario = role === 'operario';
    const canCreate  = isAdmin;
    const canEdit    = isAdmin;
    const canDelete  = isAdmin;

    return { isAdmin, isOperario, canCreate, canEdit, canDelete };
}
