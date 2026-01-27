import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Stack,
  Divider,
} from "@mui/material";
import {
  Search,
  Download,
  Refresh,
  FilterList,
  TrendingUp,
  DateRange,
  AttachMoney,
  People,
  Receipt,
} from "@mui/icons-material";
import { useMediaQuery, useTheme } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { useNotification } from "../utils/notifications";
import { axiosApi } from "../utils/api";
import * as XLSX from 'xlsx';

const Income = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState({ 
    income: true,
    exporting: false
  });
  const [incomes, setIncomes] = useState([]);
  const [allIncomes, setAllIncomes] = useState([]);
  const [incomeSummary, setIncomeSummary] = useState(null);
  const [incomeTrends, setIncomeTrends] = useState([]);
  const { notification, showNotification, hideNotification } = useNotification();

  // Filters and Search
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeTab, setActiveTab] = useState(0);

  // Table pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Fetch income data
  useEffect(() => {
    fetchData();
  }, [dateRangeFilter]);

  // Fetch income trends when tab changes
  useEffect(() => {
    if (activeTab === 1) {
      fetchIncomeTrends();
    }
  }, [activeTab, dateRangeFilter]);

  const fetchData = async () => {
    setLoading({ income: true, exporting: false });
    try {
      // Fetch income records with date filter
      const params = { limit: 1000 };
      if (dateRangeFilter === 'today') {
        params.startDate = new Date().toISOString().split('T')[0];
        params.endDate = new Date().toISOString().split('T')[0];
      } else if (dateRangeFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        params.startDate = weekAgo.toISOString().split('T')[0];
      } else if (dateRangeFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        params.startDate = monthAgo.toISOString().split('T')[0];
      } else if (dateRangeFilter === 'custom' && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const incomeRes = await axiosApi.income.getAll(params);
      const incomeData = incomeRes.data?.records || incomeRes.data || [];
      const incomesArray = Array.isArray(incomeData) ? incomeData : [];
      setAllIncomes(incomesArray);
      setIncomes(incomesArray);

      // Fetch income summary
      const summaryRes = await axiosApi.income.getSummary();
      setIncomeSummary(summaryRes.data);

    } catch (err) {
      console.error('Error fetching data:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch data';
      showNotification("error", `Failed to fetch data: ${errorMsg}`);
    } finally {
      setLoading({ income: false, exporting: false });
    }
  };

  const fetchIncomeTrends = async () => {
    try {
      let trendsData = [];
      if (dateRangeFilter === 'week' || dateRangeFilter === 'all') {
        const weeklyRes = await axiosApi.income.getWeekly();
        trendsData = weeklyRes.data?.weeklyIncome || [];
      } else if (dateRangeFilter === 'month') {
        const monthlyRes = await axiosApi.income.getMonthly();
        trendsData = monthlyRes.data?.monthlyIncome || [];
      }
      setIncomeTrends(trendsData);
    } catch (err) {
      console.error('Error fetching trends:', err);
    }
  };

  // Filter and sort incomes
  const filteredAndSortedIncomes = useMemo(() => {
    let filtered = [...allIncomes];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(income => {
        const customerName = (income.customerName || '').toLowerCase();
        const slipNumber = (income.slipNumber || '').toLowerCase();
        const productName = income.productsSold?.[0]?.productName?.toLowerCase() || '';
        return customerName.includes(term) || 
               slipNumber.includes(term) || 
               productName.includes(term);
      });
    }

    // Payment method filter
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(income => income.paymentMethod === paymentMethodFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'date':
          aVal = new Date(a.date || a.createdAt);
          bVal = new Date(b.date || b.createdAt);
          break;
        case 'amount':
          aVal = a.totalIncome || 0;
          bVal = b.totalIncome || 0;
          break;
        case 'customer':
          aVal = (a.customerName || '').toLowerCase();
          bVal = (b.customerName || '').toLowerCase();
          break;
        default:
          return 0;
      }
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      } else {
        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
      }
    });

    return filtered;
  }, [allIncomes, searchTerm, paymentMethodFilter, sortBy, sortOrder]);

  // Paginated incomes
  const paginatedIncomes = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredAndSortedIncomes.slice(start, start + rowsPerPage);
  }, [filteredAndSortedIncomes, page, rowsPerPage]);

  // Top customers by income
  const topCustomers = useMemo(() => {
    const customerMap = new Map();
    filteredAndSortedIncomes.forEach(income => {
      const customer = income.customerName || 'Walk Customer';
      const current = customerMap.get(customer) || 0;
      customerMap.set(customer, current + (income.totalIncome || 0));
    });
    return Array.from(customerMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredAndSortedIncomes]);

  // Export to Excel
  const handleExportExcel = () => {
    setLoading({ income: false, exporting: true });
    try {
      const exportData = filteredAndSortedIncomes.map(income => ({
        'Date': new Date(income.date || income.createdAt).toLocaleDateString(),
        'Customer Name': income.customerName || 'Walk Customer',
        'Payment Method': income.paymentMethod || 'Cash',
        'Total Income': income.totalIncome || 0,
        'Products': income.productsSold?.map(p => `${p.productName} (x${p.quantity})`).join(', ') || '',
        'Slip Number': income.slipNumber || '',
        'Notes': income.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Income Report');
      XLSX.writeFile(wb, `Income_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      showNotification('success', 'Income data exported to Excel successfully!');
    } catch (err) {
      console.error('Export error:', err);
      showNotification('error', 'Failed to export data');
    } finally {
      setLoading({ income: false, exporting: false });
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading.income) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>Loading income data...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 }, 
      maxWidth: 1600, 
      margin: '0 auto',
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%)'
    }}>
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ 
              mb: 1, 
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
            }}>
              Income Management
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' },
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
            }}>
              Track, analyze, and export your sales income
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Tooltip title="Export to Excel">
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleExportExcel}
                disabled={loading.exporting || filteredAndSortedIncomes.length === 0}
                size={isMobile ? 'small' : 'medium'}
              >
                Export
              </Button>
            </Tooltip>
            <Tooltip title="Refresh Data">
              <IconButton onClick={fetchData} disabled={loading.income}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Box>

      {/* Income Summary */}
      {incomeSummary && (
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>Total Income</Typography>
                <Typography variant="h4" fontWeight="bold">
                  Rs {incomeSummary.totalIncome?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(245, 87, 108, 0.3)',
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>Today's Income</Typography>
                <Typography variant="h4" fontWeight="bold">
                  Rs {incomeSummary.todayIncome?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)',
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>Monthly Income</Typography>
                <Typography variant="h4" fontWeight="bold">
                  Rs {incomeSummary.monthIncome?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(250, 112, 154, 0.3)',
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>Total Records</Typography>
                <Typography variant="h4" fontWeight="bold">
                  {filteredAndSortedIncomes.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Filters and Search */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search"
              placeholder="Search by customer, slip, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Range</InputLabel>
              <Select
                value={dateRangeFilter}
                onChange={(e) => {
                  setDateRangeFilter(e.target.value);
                  setPage(0);
                }}
                label="Date Range"
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
                <MenuItem value="custom">Custom Range</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {dateRangeFilter === 'custom' && (
            <>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="Start Date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  fullWidth
                  type="date"
                  label="End Date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  size="small"
                  inputProps={{ min: startDate || undefined }}
                />
              </Grid>
            </>
          )}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethodFilter}
                onChange={(e) => {
                  setPaymentMethodFilter(e.target.value);
                  setPage(0);
                }}
                label="Payment Method"
              >
                <MenuItem value="all">All Methods</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Udhar">Udhar</MenuItem>
                <MenuItem value="Account">Account</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(0);
                }}
                label="Sort By"
              >
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="amount">Amount</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: 2 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Income List" icon={<Receipt />} iconPosition="start" />
          <Tab label="Trends" icon={<TrendingUp />} iconPosition="start" />
          <Tab label="Top Customers" icon={<People />} iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Customer</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Payment</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', display: { xs: 'none', md: 'table-cell' } }}>Products</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Slip</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedIncomes.map((income) => (
                  <TableRow key={income._id} hover>
                    <TableCell>
                      {new Date(income.date || income.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{income.customerName || 'Walk Customer'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={income.paymentMethod || 'Cash'} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>
                      Rs {income.totalIncome?.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      {income.productsSold?.[0]?.productName || 'N/A'}
                      {income.productsSold?.length > 1 && ` +${income.productsSold.length - 1}`}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="primary">
                        {income.slipNumber || 'N/A'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredAndSortedIncomes.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
          {filteredAndSortedIncomes.length === 0 && (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                No income records found
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Income Trends
          </Typography>
          {incomeTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={incomeTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip />
                <Legend />
                <Line type="monotone" dataKey="totalIncome" stroke="#1976d2" strokeWidth={2} name="Income" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                No trend data available
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom>
            Top Customers by Income
          </Typography>
          {topCustomers.length > 0 ? (
            <Grid container spacing={2}>
              {topCustomers.map((customer, index) => (
                <Grid item xs={12} sm={6} md={4} key={customer.name}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            #{index + 1} {customer.name}
                          </Typography>
                          <Typography variant="h5" color="success.main" sx={{ mt: 1 }}>
                            Rs {customer.total.toLocaleString()}
                          </Typography>
                        </Box>
                        <People sx={{ fontSize: 48, color: 'primary.main', opacity: 0.3 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="textSecondary">
                No customer data available
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={hideNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Income;
