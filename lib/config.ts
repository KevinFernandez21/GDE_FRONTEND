/**
 * Configuration for the GDE Frontend
 */

// Get API configuration
export const getApiConfig = () => {
  // Use Vercel proxy in production, direct API in development
  const isProduction = process.env.NODE_ENV === 'production';
  const apiUrl = isProduction
    ? (typeof window !== 'undefined' ? window.location.origin : '')
    : (process.env.NEXT_PUBLIC_API_URL || 'https://yummy-cymbre-orangecorp-43ef562b.koyeb.app');

  const apiBaseUrl = isProduction
    ? (typeof window !== 'undefined' ? `${window.location.origin}/api` : '/api')
    : (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://yummy-cymbre-orangecorp-43ef562b.koyeb.app/api/v1');

  // Debug log
  console.log('API Configuration:', {
    isProduction,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    resolved_apiUrl: apiUrl,
    resolved_apiBaseUrl: apiBaseUrl,
    usingProxy: isProduction
  });

  return {
    apiUrl,
    apiBaseUrl
  };
};

export const config = getApiConfig();