// Build information - generated at build time
export const BUILD_INFO = {
  buildTime: new Date().toISOString(),
  buildTimestamp: Date.now(),
  version: process.env.REACT_APP_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  apiBaseUrl: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081/api'
};
