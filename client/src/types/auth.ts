export type Role = "ADMIN" | "AGENT" | "CUSTOMER";

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: {
        id: string;
        name: string;
        email: string;
        role: Role;
    };
}

export interface CurrentUserResponse {
    success: boolean;
    statusCode: number;
    message: string;
    data: User;
}

export interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    initialized: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    logout: () => Promise<void>;
    fetchCurrentUser: () => Promise<void>;
    clearAuth: () => void;
}
