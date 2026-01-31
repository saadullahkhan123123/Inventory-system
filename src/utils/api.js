import axios from 'axios';

// Backend API Base URL - Production
const API_BASE_URL = 'https://saeedautobackend.vercel.app/api';

export const axiosApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // Increased timeout for production
});

// Enhanced request interceptor for debugging (only in development)
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

axiosApi.interceptors.request.use(
  (config) => {
    if (isDevelopment) {
      console.log('🔗 API CALL DEBUG:');
      console.log('📍 Full URL:', config.baseURL + config.url);
      console.log('🏠 Base URL:', config.baseURL);
      console.log('📝 Endpoint:', config.url);
      console.log('🔄 Method:', config.method?.toUpperCase());
      console.log('---');
    }
    return config;
  },
  (error) => {
    console.error('❌ Request setup error:', error);
    return Promise.reject(error);
  }
);

// Retry configuration for 503 errors
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // Base delay in milliseconds

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to check if error should be retried
const shouldRetry = (error, retryCount) => {
  // Only retry 503 errors (Service Unavailable) and network errors
  const is503 = error.response?.status === 503;
  const isNetworkError = error.code === 'ECONNABORTED' || error.message === 'Network Error';
  const isConnectionError = error.code === 'ERR_BAD_RESPONSE' && error.response?.status === 503;
  
  return (is503 || isNetworkError || isConnectionError) && retryCount < MAX_RETRIES;
};

// Enhanced response interceptor with retry logic
axiosApi.interceptors.response.use(
  (response) => {
    if (isDevelopment) {
      console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - Success`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Check if this request has already been retried
    const retryCount = originalRequest._retryCount || 0;
    
    // Only log detailed errors in development or for non-503 errors
    if (isDevelopment || error.response?.status !== 503) {
      console.error('❌ API Error Details:');
      console.error('URL:', error.config?.baseURL + error.config?.url);
      console.error('Method:', error.config?.method?.toUpperCase());
      console.error('Status:', error.response?.status);
      console.error('Data:', error.response?.data);
      console.error('Message:', error.message);
      console.error('Retry Count:', retryCount);
      
      // Handle specific error cases
      if (error.code === 'ECONNABORTED') {
        console.error('⏰ Request timeout');
      }
      if (error.message === 'Network Error') {
        console.error('🌐 Network error - check CORS or server availability');
      }
    }
    
    // Retry logic for 503 errors (Database connection unavailable)
    if (shouldRetry(error, retryCount)) {
      originalRequest._retryCount = retryCount + 1;
      
      // Calculate exponential backoff delay
      const delayMs = RETRY_DELAY_BASE * Math.pow(2, retryCount);
      
      if (isDevelopment) {
        console.log(`🔄 Retrying request (attempt ${retryCount + 1}/${MAX_RETRIES}) after ${delayMs}ms...`);
      }
      
      // Wait before retrying
      await delay(delayMs);
      
      // Retry the request
      return axiosApi(originalRequest);
    }
    
    // If we've exhausted retries or it's not a retryable error, enhance error message
    if (error.response?.status === 503) {
      const errorData = error.response.data;
      if (errorData?.error === 'Database connection unavailable') {
        error.userMessage = 'Database connection is temporarily unavailable. The system is trying to reconnect. Please wait a moment and refresh the page.';
      } else {
        error.userMessage = 'Service is temporarily unavailable. Please wait a moment and try again.';
      }
    } else if (error.code === 'ECONNABORTED') {
      error.userMessage = 'Request timed out. Please check your connection and try again.';
    } else if (error.message === 'Network Error') {
      error.userMessage = 'Network error. Please check your internet connection.';
    } else {
      error.userMessage = error.response?.data?.error || error.message || 'An unexpected error occurred.';
    }
    
    return Promise.reject(error);
  }
);

// Test backend connection
axiosApi.testConnection = () => axiosApi.get('/test');

// Items API
axiosApi.items = {
  getAll: (params = {}) => axiosApi.get('/items', { params }),
  getById: (id) => axiosApi.get(`/items/${id}`),
  create: (data) => axiosApi.post('/items', data),
  update: (id, data) => axiosApi.put(`/items/${id}`, data),
  delete: (id) => axiosApi.delete(`/items/${id}`),
  updateStock: (id, data) => axiosApi.patch(`/items/${id}/stock`, data),
  getLowStock: () => axiosApi.get('/items/low-stock'),
  getOutOfStock: () => axiosApi.get('/items/out-of-stock'),
};

// Slips API
axiosApi.slips = {
  getAll: (params = {}) => axiosApi.get('/slips', { params }),
  getById: (id) => axiosApi.get(`/slips/${id}`),
  create: (data) => axiosApi.post('/slips', data),
  update: (id, data) => axiosApi.put(`/slips/${id}`, data),
  cancel: (id, reason = '') => axiosApi.patch(`/slips/cancel/${id}`, { reason }),
  delete: (id) => axiosApi.delete(`/slips/${id}`),
};

// Income API
axiosApi.income = {
  getAll: (params = {}) => axiosApi.get('/income', { params }),
  getById: (id) => axiosApi.get(`/income/${id}`),
  create: (data) => axiosApi.post('/income', data),
  update: (id, data) => axiosApi.put(`/income/${id}`, data),
  delete: (id) => axiosApi.delete(`/income/${id}`),
  getSummary: () => axiosApi.get('/income/summary/overview'),
  getToday: () => axiosApi.get('/income/today'),
  getWeekly: () => axiosApi.get('/income/weekly'),
  getMonthly: () => axiosApi.get('/income/monthly'),
  getTopProducts: (params = {}) => axiosApi.get('/income/top-products', { params }),
};

// Analytics API
axiosApi.analytics = {
  getDashboard: () => axiosApi.get('/analytics/dashboard'),
  getSalesTrends: (params = {}) => axiosApi.get('/analytics/sales-trends', { params }),
  getTopProducts: (params = {}) => axiosApi.get('/analytics/top-products', { params }),
  getInventoryLevels: () => axiosApi.get('/analytics/inventory-levels'),
  getOrdersByStatus: () => axiosApi.get('/analytics/orders-by-status'),
};

// History API
axiosApi.history = {
  getSlips: (params = {}) => axiosApi.get('/history/slips', { params }),
  getIncome: (params = {}) => axiosApi.get('/history/income', { params }),
  getCombined: (params = {}) => axiosApi.get('/history/combined', { params }),
};

// Customer History API
axiosApi.customerHistory = {
  test: () => axiosApi.get('/customer-history/test'),
  getByCustomerName: (customerName, params = {}) => {
    const encodedName = encodeURIComponent(customerName);
    console.log('📞 Calling customer history API:', `/customer-history/${encodedName}`);
    return axiosApi.get(`/customer-history/${encodedName}`, { params });
  },
  getSuggestions: (query, type = 'all') => {
    console.log('📞 Calling suggestions API:', '/customer-history/search/suggestions');
    return axiosApi.get('/customer-history/search/suggestions', { params: { query, type } });
  },
};

// Health check function
export const checkBackendHealth = async () => {
  try {
    console.log('🏥 Checking backend health...');
    const response = await axiosApi.get('/test');
    console.log('✅ Backend is healthy:', response.data);
    return { healthy: true, data: response.data };
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    return { 
      healthy: false, 
      error: error.message,
      details: error.response?.data 
    };
  }
};

// Test all endpoints quickly
export const testAllEndpoints = async () => {
  const tests = [
    { name: 'Backend Connection', fn: axiosApi.testConnection },
    { name: 'Items', fn: () => axiosApi.items.getAll({ limit: 1 }) },
    { name: 'Income', fn: () => axiosApi.income.getAll({ limit: 1 }) },
    { name: 'Slips', fn: () => axiosApi.slips.getAll({ limit: 1 }) },
    { name: 'Analytics', fn: axiosApi.analytics.getDashboard },
  ];

  console.log('🧪 Testing all endpoints...');
  const results = [];
  
  for (const test of tests) {
    try {
      const res = await test.fn();
      console.log(`✅ ${test.name}: OK`);
      results.push({
        name: test.name,
        status: '✅ OK',
        data: res.data,
      });
    } catch (err) {
      console.error(`❌ ${test.name}: Failed -`, err.message);
      results.push({ 
        name: test.name, 
        status: '❌ Failed', 
        error: err.response?.data?.error || err.message,
        url: err.config?.baseURL + err.config?.url
      });
    }
  }
  
  console.log('📊 Test results:', results);
  return results;
};

export default axiosApi;