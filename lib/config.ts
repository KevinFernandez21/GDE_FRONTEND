/**
 * Configuration for the GDE Frontend
 */

// Get API configuration
export const getApiConfig = () => {
  // Always use /api proxy (works both in development and production)
  // The proxy will rewrite /api/* to the backend URL
  const apiBaseUrl = '/api';
  const apiUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'http://localhost:3003'; // Default for SSR

  // Debug log
  console.log('API Configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    resolved_apiUrl: apiUrl,
    resolved_apiBaseUrl: apiBaseUrl,
    isBrowser: typeof window !== 'undefined',
    usingProxy: true
  });

  return {
    apiUrl,
    apiBaseUrl
  };
};

export const config = getApiConfig();