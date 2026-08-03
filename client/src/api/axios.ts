import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5040/api";

let onUnauthorized: (() => void) | null = null;

export const registerUnauthorizedHandler = (handler: () => void) => {
    onUnauthorized = handler;
};

const axiosInstance = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json"
    }
});

// Response interceptor
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            if (onUnauthorized) {
                onUnauthorized();
            }
        }
        
        // Centralized error unpacking
        const errorData = error.response?.data || {
            success: false,
            message: error.message || "Network error. Please try again."
        };
        
        return Promise.reject(errorData);
    }
);

export default axiosInstance;
