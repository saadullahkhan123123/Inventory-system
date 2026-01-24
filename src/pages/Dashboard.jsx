import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, FormControl, InputLabel, Select, MenuItem,
  CircularProgress, Alert, Button, Tooltip, IconButton, Chip, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Badge, List, ListItem, ListItemText, Divider
} from '@mui/material';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
  Download, Refresh, HelpOutline, TrendingUp, People, Inventory2, 
  Warning, Receipt, AttachMoney, Notifications, PendingActions, Timeline
} from '@mui/icons-material';
import { axiosApi } from '../utils/api';
import { useNotification } from '../utils/notifications';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

function Dashboard() {
  const navigate = useNavigate();
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

      {/* Enhanced Summary Cards - 10+ Features */}
      {dashboardData?.summary && (
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: 4 }}>
          {/* Total Revenue */}
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              height: '100%',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }} onClick={() => navigate('/income')}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AttachMoney sx={{ fontSize: { xs: '20px', sm: '24px' }, mr: 1 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Total Revenue</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}>
                  Rs {dashboardData.summary.totalRevenue?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Today's Revenue */}
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(245, 87, 108, 0.3)',
              height: '100%',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TrendingUp sx={{ fontSize: { xs: '20px', sm: '24px' }, mr: 1 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Today</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}>
                  Rs {dashboardData.summary.todayRevenue?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Monthly Revenue */}
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)',
              height: '100%',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Receipt sx={{ fontSize: { xs: '20px', sm: '24px' }, mr: 1 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>This Month</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}>
                  Rs {dashboardData.summary.monthlyRevenue?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Total Customers */}
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(48, 207, 208, 0.3)',
              height: '100%',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }} onClick={() => navigate('/customer-history')}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <People sx={{ fontSize: { xs: '20px', sm: '24px' }, mr: 1 }} />
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Customers</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}>
                  {dashboardData.summary.totalCustomers || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Low Stock Alert */}
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(250, 112, 154, 0.3)',
              height: '100%',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              '&:hover': { transform: 'translateY(-4px)' }
            }} onClick={() => navigate('/inventory')}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Badge badgeContent={dashboardData.summary.lowStockItems || 0} color="error">
                    <Warning sx={{ fontSize: { xs: '20px', sm: '24px' }, mr: 1 }} />
                  </Badge>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Low Stock</Typography>
                </Box>
                <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.75rem' } }}>
                  {dashboardData.summary.lowStockItems || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Additional Stats Row */}
      {dashboardData?.summary && (
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: 4 }}>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              height: '100%'
            }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Yearly Revenue</Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Rs {dashboardData.summary.yearlyRevenue?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              height: '100%'
            }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Total Items</Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {dashboardData.summary.totalItems || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              height: '100%'
            }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Total Slips</Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {dashboardData.summary.totalSlips || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              height: '100%'
            }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Out of Stock</Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {dashboardData.summary.outOfStockItems || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={4} md={2.4}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #fdbb2d 0%, #22c1c3 100%)',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
              height: '100%'
            }}>
              <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Pending Orders</Typography>
                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  {dashboardData.summary.pendingOrders || 0}
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
            <Box sx={{ width: '100%', height: { xs: 250, sm: 300 }, mt: 2, minHeight: 200 }}>
              <ResponsiveContainer>
                <LineChart data={salesTrends.map(item => ({
                  date: item._id.date,
                  sales: item.totalSales,
                  transactions: item.totalTransactions
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
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
            <Box sx={{ width: '100%', height: { xs: 250, sm: 300 }, mt: 2, minHeight: 200 }}>
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
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Top Selling Products ({timeRange})
            </Typography>
            <Box sx={{ width: '100%', height: { xs: 250, sm: 300, md: 350 }, mt: 2, minHeight: 200 }}>
              <ResponsiveContainer>
                <BarChart data={topProducts.map(item => ({
                  name: item._id?.length > 20 ? item._id.substring(0, 20) + '...' : item._id,
                  quantity: item.totalQuantity,
                  revenue: item.totalRevenue
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} />
                  <YAxis yAxisId="left" fontSize={12} />
                  <YAxis yAxisId="right" orientation="right" fontSize={12} />
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
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Inventory Stock Levels
            </Typography>
            <Box sx={{ width: '100%', height: { xs: 250, sm: 300, md: 350 }, mt: 2, minHeight: 200 }}>
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
                  <XAxis type="number" fontSize={12} />
                  <YAxis dataKey="name" type="category" fontSize={12} />
                  <RechartsTooltip />
                  <Bar dataKey="value" fill="#00C49F" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent Transactions & Activity Logs */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Recent Transactions */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                Recent Transactions
              </Typography>
              <Button size="small" onClick={() => navigate('/search-slips')} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                View All
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>Slip #</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>Customer</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>Amount</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>Date</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dashboardData?.recentSales?.slice(0, 5).map((sale, idx) => (
                    <TableRow key={idx} hover>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{sale.slipNumber || 'N/A'}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{sale.customerName || 'Walk-in'}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, fontWeight: 'bold', color: 'success.main' }}>
                        Rs {sale.totalAmount?.toLocaleString() || 0}
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={sale.status || 'Paid'} 
                          size="small" 
                          color={sale.status === 'Paid' ? 'success' : sale.status === 'Pending' ? 'warning' : 'error'}
                          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* System Alerts & Notifications */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Notifications sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                System Alerts
              </Typography>
            </Box>
            <List dense>
              {dashboardData?.summary?.lowStockItems > 0 && (
                <ListItem sx={{ px: 0 }}>
                  <Chip 
                    icon={<Warning />} 
                    label={`${dashboardData.summary.lowStockItems} items low in stock`} 
                    color="warning" 
                    size="small"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  />
                </ListItem>
              )}
              {dashboardData?.summary?.outOfStockItems > 0 && (
                <ListItem sx={{ px: 0 }}>
                  <Chip 
                    icon={<Inventory2 />} 
                    label={`${dashboardData.summary.outOfStockItems} items out of stock`} 
                    color="error" 
                    size="small"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  />
                </ListItem>
              )}
              {dashboardData?.summary?.pendingOrders > 0 && (
                <ListItem sx={{ px: 0 }}>
                  <Chip 
                    icon={<PendingActions />} 
                    label={`${dashboardData.summary.pendingOrders} pending orders`} 
                    color="info" 
                    size="small"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  />
                </ListItem>
              )}
              {(!dashboardData?.summary?.lowStockItems && !dashboardData?.summary?.outOfStockItems && !dashboardData?.summary?.pendingOrders) && (
                <ListItem sx={{ px: 0 }}>
                  <Typography variant="body2" color="textSecondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    No alerts at this time
                  </Typography>
                </ListItem>
              )}
            </List>
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

