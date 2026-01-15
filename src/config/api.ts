const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  'https://solidoro-backend-production.up.railway.app/api';

export const API_BASE_URL = rawBaseUrl.replace(/\/+$/, '');

export function api(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}
