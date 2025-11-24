import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { createCacheKey } from "@/utils/performance";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// FIXED: Robust API request function with proper error handling
export async function apiRequest(
  url: string,
  method: string = 'GET',
  data?: any
): Promise<any> {
  console.log(`[API] ${method} ${url}`, data);

  const requestOptions: RequestInit = {
    method: method.toUpperCase(),
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    credentials: "include",
  };

  // Add body for POST, PUT, PATCH requests
  if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase()) && data) {
    requestOptions.body = JSON.stringify(data);
    console.log(`[API] Request body:`, requestOptions.body);
  }

  try {
    const response = await fetch(url, requestOptions);
    console.log(`[API] Response ${response.status} for ${url}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error ${response.status}: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const result = await response.json();
      console.log(`[API] Success:`, result);
      return result;
    }

    console.log(`[API] Non-JSON response for ${url}`);
    return {};
  } catch (error) {
    console.error(`[API] Fetch error for ${method} ${url}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// TanStack Query Client mit OPTIMIERTEN Einstellungen für DELTAWAYS HELIX
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Use custom queryFn for better error handling
      queryFn: async ({ queryKey }) => {
        let url = queryKey[0] as string;
        const params = queryKey[1] as Record<string, any> || {};

        // Build query string from parameters
        if (Object.keys(params).length > 0) {
          const searchParams = new URLSearchParams();
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              searchParams.append(key, String(value));
            }
          });
          url += `?${searchParams.toString()}`;
        }

        console.log(`[QUERY CLIENT] Fetching: ${url}`);
        // Add timeout support
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        try {
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            credentials: "include",
            signal: controller.signal,
          });

          clearTimeout(timeoutId);
          console.log(`[QUERY CLIENT] Response ${response.status} for ${url}`);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[QUERY CLIENT] HTTP ${response.status}: ${errorText}`);
            const error = new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
            (error as any).status = response.status;
            throw error;
          }

          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log(`[QUERY CLIENT] Success: Data received for ${url}`);
            return data;
          } else {
            console.warn(`[QUERY CLIENT] Non-JSON response for ${url}`);
            return {};
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            console.error(`[QUERY CLIENT] Timeout for ${url}`);
            throw new Error('Request timeout');
          }
          throw fetchError;
        }
      },
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: (failureCount, error: any) => {
        // Only log on first retry to reduce noise
        if (failureCount === 1) {
          console.log(`[QUERY CLIENT] Retry attempt ${failureCount} for:`, error?.message || 'Network error');
        }

        // No retries for client errors (4xx) or for specific endpoints that are known to fail
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }

        // Reduce retries to 2 for better performance
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => {
        // SCHNELLERE Retry-Strategie
        const delay = Math.min(500 * (attemptIndex + 1), 2000);
        return delay;
      },
      // KRITISCHER FIX: Timeout für Queries
      meta: {
        timeout: 10000 // 10 Sekunden
      }
    },
    mutations: {
      retry: false, // Mutations nicht retry
      meta: {
        timeout: 15000 // 15 Sekunden für Mutations
      }
    }
  },
});