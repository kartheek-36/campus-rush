const API_ORIGIN = (import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://campus-rush-6ur1.onrender.com' : '')).replace(/\/$/, '').replace(/\/api$/, '');
const API_URL = `${API_ORIGIN}/api`;

const redactResponse = (body: unknown) => {
  if (!body || typeof body !== 'object') return body;
  const redacted = { ...(body as Record<string, unknown>) };
  if ('token' in redacted) redacted.token = '[redacted]';
  if (redacted.data && typeof redacted.data === 'object') {
    redacted.data = { ...(redacted.data as Record<string, unknown>) };
    if ('token' in (redacted.data as Record<string, unknown>)) (redacted.data as Record<string, unknown>).token = '[redacted]';
  }
  return redacted;
};

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
  const requestUrl = `${API_URL}${path}`;
  let response: Response;
  try {
    response = await fetch(requestUrl, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options?.headers },
    });
  } catch {
    throw new ApiError(0, `Backend unavailable or blocked by CORS. Check the API URL (${API_URL}) and backend CORS settings.`, 'network');
  }

  const responseBody = await response.json().catch(() => null) as ApiResponse<T> | { message?: string } | null;
  console.info('Campus Rush API', { url: requestUrl, method: options?.method || 'GET', status: response.status, response: redactResponse(responseBody) });

  if (!response.ok) {
    let message = `Campus Rush service returned ${response.status}`;
    message = (responseBody as { message?: string } | null)?.message || message;
    const kind = response.status === 404 ? 'endpoint' : response.status >= 500 ? 'backend' : 'backend';
    throw new ApiError(response.status, `${message}${kind === 'endpoint' ? ' Check the API endpoint path.' : ''}`, kind);
  }

  return responseBody as ApiResponse<T>;
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
