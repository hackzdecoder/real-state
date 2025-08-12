import { useState } from 'react';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface UseEndpointParams<TRequestBody> {
    url: string;
    method: HttpMethod;
    body?: TRequestBody;
}

interface EndpointResponse<TData> {
    data: TData | null;
    error: string | null;
    isLoading: boolean;
    execute: () => Promise<void>;
}

const useEndpoint = <TData = unknown, TRequestBody = unknown>({
    url,
    method,
    body,
}: UseEndpointParams<TRequestBody>): EndpointResponse<TData> => {
    const [data, setData] = useState<TData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const execute = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers.Authorization = `Bearer ${token}`;
            }

            const apiUrl = import.meta.env.DEV
                ? `http://localhost:5000${url}`
                : url;

            const res = await fetch(apiUrl, {
                method,
                headers,
                body: method !== 'GET' && body ? JSON.stringify(body) : null,
            });

            const responseData = await res.json();

            if (!res.ok) {
                const errorMsg = responseData?.error || responseData?.message || 'Request failed';
                throw new Error(errorMsg);
            }

            setData(responseData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
            setError(errorMessage);
            console.error('API Error:', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return { data, error, isLoading, execute };
};

export default useEndpoint;
