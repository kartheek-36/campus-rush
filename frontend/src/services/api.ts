const API_ORIGIN = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://campus-rush-6ur1.onrender.com' : 'http://localhost:5000')).replace(/\/$/, '').replace(/\/api$/, '');
const API_URL = `${API_ORIGIN}/api`;

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export class ApiError extends Error {
  constructor(public status: number, message: string, public kind: 'backend' | 'endpoint' | 'network' | 'cors' = 'backend') {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  const token = typeof window !== 'undefined' ? window.localStorage.getItem('campus-rush-token') : null;
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options?.headers },
    });
  } catch {
    throw new ApiError(0, `Backend unavailable or blocked by CORS. Check the API URL (${API_URL}) and backend CORS settings.`, 'network');
  }

  if (!response.ok) {
    let message = `Campus Rush service returned ${response.status}`;
    try {
      const errorBody = await response.json() as { message?: string };
      message = errorBody.message || message;
    } catch {
      // Keep the generic message when the server has no JSON error body.
    }
    const kind = response.status === 404 ? 'endpoint' : response.status >= 500 ? 'backend' : 'backend';
    throw new ApiError(response.status, `${message}${kind === 'endpoint' ? ' Check the API endpoint path.' : ''}`, kind);
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
