import { useState } from 'react';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface UseEndpointParams<TRequestBody> {
    url: string;
    method: HttpMethod;
    body?: TRequestBody;
}

export interface EndpointResponse<TData, TRequestBody = unknown> {
    data: TData | null;
    error: string | null;
    isLoading: boolean;
    execute: (
        overrideUrl?: string,
        overrideBody?: TRequestBody,
        overrideMethod?: HttpMethod // <-- add this
    ) => Promise<void>;
}

const useEndpoint = <TData = unknown, TRequestBody = unknown>({
    url,
    method,
    body,
}: UseEndpointParams<TRequestBody>): EndpointResponse<TData, TRequestBody> => {
    const [data, setData] = useState<TData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const execute = async (
        overrideUrl?: string,
        overrideBody?: TRequestBody,
        overrideMethod?: HttpMethod // <--- add this
    ) => {
        setIsLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {};
            const sendBody = overrideBody ?? body;

            if (!(sendBody instanceof FormData)) headers['Content-Type'] = 'application/json';
            if (token) headers.Authorization = `Bearer ${token}`;

            const apiUrl = import.meta.env.DEV
                ? `http://localhost:5000${overrideUrl ?? url}`
                : overrideUrl ?? url;

            const res = await fetch(apiUrl, {
                method: overrideMethod ?? method, // use overrideMethod if provided
                headers,
                body: (overrideMethod ?? method) !== 'GET' && sendBody
                    ? sendBody instanceof FormData ? sendBody : JSON.stringify(sendBody)
                    : null,
            });

            const responseData = await res.json();
            if (!res.ok) throw new Error(responseData?.error || responseData?.message || 'Request failed');

            setData(responseData);
        } catch (err: unknown) {
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
