import { create } from "zustand";
import { loginApi, logoutApi, getCurrentUserApi } from "../api/auth.api.js";
import { registerUnauthorizedHandler } from "../api/axios.js";
import type { AuthState, User, LoginRequest } from "../types/auth.js";

export const useAuthStore = create<AuthState>((set, get) => {
    
    // Register global axios 401 callback to clear local state
    registerUnauthorizedHandler(() => {
        get().clearAuth();
    });

    return {
        user: null,
        isAuthenticated: false,
        loading: false,
        initialized: false,

        login: async (credentials: LoginRequest) => {
            set({ loading: true });
            try {
                // 1. Post to login endpoint
                await loginApi(credentials);
                // 2. Fetch full user details from /auth/me
                await get().fetchCurrentUser();
            } catch (error) {
                set({ loading: false });
                throw error;
            }
        },

        logout: async () => {
            set({ loading: true });
            try {
                await logoutApi();
            } finally {
                get().clearAuth();
            }
        },

        fetchCurrentUser: async () => {
            set({ loading: true });
            try {
                const response = await getCurrentUserApi();
                set({
                    user: response.data,
                    isAuthenticated: true,
                    loading: false,
                    initialized: true
                });
            } catch (error) {
                get().clearAuth();
                set({ initialized: true });
                throw error;
            }
        },

        clearAuth: () => {
            set({
                user: null,
                isAuthenticated: false,
                loading: false,
                initialized: true
            });
        }
    };
});
