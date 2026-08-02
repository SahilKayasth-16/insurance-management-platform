import { useAuthStore } from "../store/auth.store.js";
import type { Role } from "../types/auth.js";

export const useAuth = () => {
    const user = useAuthStore((state) => state.user);
    const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
    const loading = useAuthStore((state) => state.loading);
    const initialized = useAuthStore((state) => state.initialized);
    const login = useAuthStore((state) => state.login);
    const logout = useAuthStore((state) => state.logout);

    const role: Role | null = user ? user.role : null;

    return {
        user,
        role,
        loading,
        initialized,
        login,
        logout,
        isAuthenticated
    };
};
