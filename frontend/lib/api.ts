/**
 * Get the correct API URL for making requests
 * In development: uses rewrites to proxy to localhost:5000
 * In production: uses the full backend URL
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Check if we're running on Vercel (production) or localhost
  const isVercel = typeof window !== 'undefined' && window.location.hostname.includes('vercel.app');
  const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  // Always use Render backend for Vercel deployment
  if (isVercel) {
    return `https://taskvip.onrender.com/api/${cleanEndpoint}`;
  }
  
  // For localhost development, check if we want to use local or remote backend
  if (isLocalhost && process.env.NODE_ENV === 'development') {
    // Use environment variable to decide between local and remote backend
    const useRemoteBackend = process.env.NEXT_PUBLIC_USE_REMOTE_BACKEND === 'true';
    if (useRemoteBackend) {
      return `https://taskvip.onrender.com/api/${cleanEndpoint}`;
    }
    return `/${cleanEndpoint}`; // Use rewrites for local backend
  }
  
  // Fallback: use the configured backend URL or Render
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
