/**
 * Get the correct API URL for making requests
 * In development: uses rewrites to proxy to localhost:5000
 * In production: uses the full backend URL
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // In development, use relative paths (rewrites will handle it)
  if (process.env.NODE_ENV === 'development') {
    return `/${cleanEndpoint}`;
  }
  
  // In production, use the full backend URL
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://taskvip.onrender.com/api';
  return `${baseUrl}/${cleanEndpoint}`;
}

/**
 * Make an API request with the correct URL
 */
export async function apiRequest(endpoint: string, options?: RequestInit): Promise<Response> {
  const url = getApiUrl(endpoint);
  return fetch(url, options);
}
