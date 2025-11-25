// Single source of truth for all frontend API URLs
// Change this one value to configure all API endpoints
// Uses environment variable API_BASE_URL or defaults to gateway URL

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8081/api'; 