/**
 * Configuration for the GDE Frontend
 */

// Get API configuration
export const getApiConfig = () => {
  // In production (Vercel), use /api proxy that rewrites to backend
  // In development, use direct backend URL
  const isProduction = process.env.NODE_ENV === 'production';

  // Always use /api in browser (will be rewritten by next.config.mjs)
  // This works both in development and production
  const apiBaseUrl = typeof window !== 'undefined'
    ? '/api'  // Browser: use proxy
    : (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://yummy-cymbre-orangecorp-43ef562b.koyeb.app/api/v1'); // Server: use direct URL

  const apiUrl = typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_API_URL || 'https://yummy-cymbre-orangecorp-43ef562b.koyeb.app');

  // Debug log
  console.log('API Configuration:', {
    isProduction,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    resolved_apiUrl: apiUrl,
    resolved_apiBaseUrl: apiBaseUrl,
    isBrowser: typeof window !== 'undefined',
    usingProxy: typeof window !== 'undefined'
  });

  return {
    apiUrl,
    apiBaseUrl
  };
};

export const config = getApiConfig();