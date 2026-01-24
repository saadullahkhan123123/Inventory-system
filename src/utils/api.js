import axios from 'axios';

// Backend API Base URL - Auto-detect localhost or production
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isLocalhost 
  ? 'http://localhost:5000/api'  // Local development
  : 'https://inventory-system-backend-ten.vercel.app/api';  // Production

export const axiosApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000, // Increased timeout for production
});

// Enhanced request interceptor for debugging
axiosApi.interceptors.request.use(
  (config) => {
    console.log('🔗 API CALL DEBUG:');
    console.log('📍 Full URL:', config.baseURL + config.url);
    console.log('🏠 Base URL:', config.baseURL);
    console.log('📝 Endpoint:', config.url);
    console.log('🔄 Method:', config.method?.toUpperCase());
    console.log('---');
    return config;
  },
  (error) => {
    console.error('❌ Request setup error:', error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor
axiosApi.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - Success`);
    return response;
  },
  (error) => {
    console.error('❌ API Error Details:');
    console.error('URL:', error.config?.baseURL + error.config?.url);
    console.error('Method:', error.config?.method?.toUpperCase());
    console.error('Status:', error.response?.status);
    console.error('Data:', error.response?.data);
    console.error('Message:', error.message);
    
    // Handle specific error cases
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout');
    }
    if (error.message === 'Network Error') {
      console.error('🌐 Network error - check CORS or server availability');
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