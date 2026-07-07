const BASE_URL = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1') 
  ? 'http://localhost:5000/api' 
  : '/api';

const API = {
  getToken: () => localStorage.getItem('expenseai_token'),
  setToken: (token) => localStorage.setItem('expenseai_token', token),
  setUser: (user) => localStorage.setItem('expenseai_user', JSON.stringify(user)),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('expenseai_user'));
    } catch {
      return null;
    }
  },
  clearAuth: () => {
    localStorage.removeItem('expenseai_token');
    localStorage.removeItem('expenseai_user');
  },
  
  request: async (endpoint, options = {}) => {
    const token = API.getToken();
    const headers = { ...options.headers };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type header if body is FormData (let browser set boundary boundary)
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // Special handling for file downloads (PDF/CSV)
      const contentType = response.headers.get('content-type');
      if (contentType && (contentType.includes('application/pdf') || contentType.includes('text/csv'))) {
        if (!response.ok) throw new Error('Export download failed');
        return response.blob(); // Return raw binary blob
      }

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Server request failed');
      }
      return data;
    } catch (err) {
      console.error(`API Error on ${endpoint}:`, err.message);
      throw err;
    }
  },

  get: (endpoint, options = {}) => API.request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options = {}) => API.request(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options = {}) => API.request(endpoint, { method: 'PUT', body, ...options }),
  delete: (endpoint, options = {}) => API.request(endpoint, { method: 'DELETE', ...options }),
};
