import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Button, Tooltip, IconButton
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Download, Refresh, HelpOutline } from '@mui/icons-material';
import { axiosApi } from '../utils/api';
import { useNotification } from '../utils/notifications';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');
  const [dashboardData, setDashboardData] = useState(null);
  const [salesTrends, setSalesTrends] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [inventoryLevels, setInventoryLevels] = useState(null);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const { notification, showNotification, hideNotification } = useNotification();

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, trendsRes, topProductsRes, inventoryRes, statusRes] = await Promise.all([
        axiosApi.analytics.getDashboard(),
        axiosApi.analytics.getSalesTrends({ period: timeRange }),
        axiosApi.analytics.getTopProducts({ limit: 10, period: timeRange }),
        axiosApi.analytics.getInventoryLevels(),
        axiosApi.analytics.getOrdersByStatus()
      ]);

      setDashboardData(dashboardRes.data);
      setSalesTrends(trendsRes.data.salesTrends || []);
      setTopProducts(topProductsRes.data.topProducts || []);
      setInventoryLevels(inventoryRes.data);
      setOrdersByStatus(statusRes.data.ordersByStatus || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to load dashboard data';
      const errorDetails = error.code === 'ECONNABORTED' 
        ? 'Request timeout - backend may be slow or unreachable'
        : error.message === 'Network Error'
        ? 'Network error - check if backend is running'
        : errorMsg;
      showNotification('error', `Failed to load dashboard data: ${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    // Simple CSV export for sales trends
    const csvContent = [
      ['Date', 'Total Sales', 'Transactions', 'Average Sale'],
      ...salesTrends.map(item => [
        item._id.date,
        item.totalSales,
        item.totalTransactions,
        item.averageSale?.toFixed(2) || 0
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-trends-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showNotification('success', 'Data exported successfully');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading dashboard...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: 1600, 
      mx: 'auto', 
      mt: { xs: 1, sm: 2 }, 
      p: { xs: 1.5, sm: 2, md: 3 },
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%)'
    }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ 
            mb: 1, 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
          }}>
            Dashboard & Analytics
          </Typography>
          <Typography variant="subtitle1" color="textSecondary" sx={{
            fontSize: { xs: '0.875rem', sm: '1rem' },
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
          }}>
            Comprehensive overview of your inventory and sales
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              label="Time Range"
            >
              <MenuItem value="week">Last Week</MenuItem>
              <MenuItem value="month">Last Month</MenuItem>
              <MenuItem value="year">Last Year</MenuItem>
            </Select>
          </FormControl>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchDashboardData} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportCSV}
            size="small"
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      {dashboardData?.summary && (
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>Total Revenue</Typography>
                <Typography variant="h4" fontWeight="bold">
                  Rs {dashboardData.summary.totalRevenue?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(245, 87, 108, 0.3)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>Today's Revenue</Typography>
                <Typography variant="h4" fontWeight="bold">
                  Rs {dashboardData.summary.todayRevenue?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>Total Items</Typography>
                <Typography variant="h4" fontWeight="bold">
                  {dashboardData.summary.totalItems || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(250, 112, 154, 0.3)'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>Low Stock Items</Typography>
                <Typography variant="h4" fontWeight="bold">
                  {dashboardData.summary.lowStockItems || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Charts Row 1 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Sales Trends */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Sales Trends ({timeRange})
            </Typography>
            <Box sx={{ width: '100%', height: 300, mt: 2 }}>
              <ResponsiveContainer>
                <LineChart data={salesTrends.map(item => ({
                  date: item._id.date,
                  sales: item.totalSales,
                  transactions: item.totalTransactions
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#1976d2" strokeWidth={2} name="Total Sales (Rs)" />
                  <Line type="monotone" dataKey="transactions" stroke="#42a5f5" strokeWidth={2} name="Transactions" />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Orders by Status */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Orders by Status
            </Typography>
            <Box sx={{ width: '100%', height: 300, mt: 2 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={ordersByStatus}
                    dataKey="count"
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {ordersByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Charts Row 2 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Top Products */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Top Selling Products ({timeRange})
            </Typography>
            <Box sx={{ width: '100%', height: 350, mt: 2 }}>
              <ResponsiveContainer>
                <BarChart data={topProducts.map(item => ({
                  name: item._id,
                  quantity: item.totalQuantity,
                  revenue: item.totalRevenue
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <RechartsTooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="quantity" fill="#42a5f5" name="Quantity Sold" />
                  <Bar yAxisId="right" dataKey="revenue" fill="#1976d2" name="Revenue (Rs)" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Inventory Levels */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold">
              Inventory Stock Levels
            </Typography>
            <Box sx={{ width: '100%', height: 350, mt: 2 }}>
              <ResponsiveContainer>
                <BarChart
                  data={[
                    { name: 'Out of Stock', value: inventoryLevels?.stockLevels?.outOfStock?.length || 0 },
                    { name: 'Low Stock', value: inventoryLevels?.stockLevels?.lowStock?.length || 0 },
                    { name: 'In Stock', value: inventoryLevels?.stockLevels?.inStock?.length || 0 }
                  ]}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Notification */}
      {notification.open && (
        <Alert
          severity={notification.severity}
          onClose={hideNotification}
          sx={{ position: 'fixed', bottom: 16, right: 16, minWidth: 300 }}
        >
          {notification.message}
        </Alert>
      )}
    </Box>
  );
}

export default Dashboard;

