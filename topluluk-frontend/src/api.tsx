import axios, { type AxiosError } from "axios";

const API_URL = 'http://localhost:8000/'

interface FailedQueuePromise {
    resolve: (value?: void) => void;
    reject: (error?: AxiosError) => void;
}

const apiClient = axios.create({
    baseURL: API_URL,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true,
    timeout: 10000,
});

let isRefreshing = false;
let failedQueue: FailedQueuePromise[] = [];

const processQueue = (error: AxiosError | null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve();
        }
    });
    failedQueue = [];
};

apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            
            if (isRefreshing) {
                // if a refresh is already in progress, queue the original request.
                return new Promise<void>((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(() => apiClient(originalRequest))
                .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await apiClient.post('api/token/refresh/');
                processQueue(null);
                return apiClient(originalRequest);
            } catch (refreshError) {
                const refreshErr = refreshError as AxiosError;
                
                processQueue(refreshErr);
                console.error('Token refresh failed:', refreshErr);
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
