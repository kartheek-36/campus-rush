const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('campus-rush-token') : null;
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options?.headers },
  });

  if (!response.ok) {
    let message = `Campus Rush service returned ${response.status}`;
    try {
      const errorBody = await response.json() as { message?: string };
      message = errorBody.message || message;
    } catch {
      // Keep the generic message when the server has no JSON error body.
    }
    throw new ApiError(response.status, message);
  }

  return response.json() as Promise<ApiResponse<T>>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) => request<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  patch: <T>(path: string, body: unknown) => request<T>(path, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
};
