import React, { useState, useEffect } from 'react';
import {
  Box, Container, Paper, Typography, TextField, Button, Grid, Card, CardContent,
  CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, Accordion, AccordionSummary, AccordionDetails, Autocomplete,
  useMediaQuery, useTheme, Divider, Stack, FormControl, InputLabel, Select, MenuItem,
  Tabs, Tab, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import DateRangeIcon from '@mui/icons-material/DateRange';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import StarIcon from '@mui/icons-material/Star';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { axiosApi } from '../utils/api';
import { useNotification } from '../utils/notifications';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const CustomerHistoryEnhanced = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const showNotification = useNotification();

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  
  // Filters
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [dateRangeDialogOpen, setDateRangeDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Fetch suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length >= 2) {
        try {
          const response = await axiosApi.customerHistory.getSuggestions(searchQuery, 'all');
          setSuggestions(response.data.suggestions || []);
        } catch (err) {
          console.error('Error fetching suggestions:', err);
        }
      } else {
        setSuggestions([]);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      showNotification('error', 'Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setSearchPerformed(true);

    try {
      const params = {
        searchType: 'name',
        ...(selectedMonth && selectedYear && { month: selectedMonth, year: selectedYear }),
        ...(startDate && { startDate: startDate.toISOString().split('T')[0] }),
        ...(endDate && { endDate: endDate.toISOString().split('T')[0] })
      };

      // Extract customer name from suggestion if it's an object
      let customerName = searchQuery;
      if (typeof searchQuery === 'object' && searchQuery.value) {
        customerName = searchQuery.value;
      }

      const response = await axiosApi.customerHistory.getByCustomerName(customerName, params);
      setHistoryData(response.data);
    } catch (err) {
      console.error('❌ Error fetching customer history:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch customer history';
      setError(errorMessage);
      setHistoryData(null);
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return `Rs ${amount?.toLocaleString() || 0}`;
  };

  const getCustomerTypeColor = (type) => {
    switch (type) {
      case 'Frequent Customer':
        return 'success';
      case 'Returning Customer':
        return 'info';
      default:
        return 'default';
    }
  };

  const handleExportPDF = () => {
    if (!historyData) return;
    
    showNotification('info', 'PDF export feature will be implemented');
    // PDF export implementation would go here
  };

  const handleExportExcel = () => {
    if (!historyData) return;

    try {
      // Prepare data for Excel
      const wsData = [
        ['Customer History Report'],
        ['Customer Name:', historyData.customerName],
        ['Phone:', historyData.customerPhone || 'N/A'],
        ['Total Slips:', historyData.summary.totalSlips],
        ['Total Amount:', formatCurrency(historyData.summary.totalAmount)],
        ['Average Bill:', formatCurrency(historyData.summary.averageBillValue)],
        [''],
        ['Slip #', 'Date', 'Products', 'Amount', 'Payment Method']
      ];

      historyData.allSlips.forEach(slip => {
        wsData.push([
          slip.slipNumber || slip._id,
          formatDate(slip.createdAt || slip.date),
          slip.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0,
          slip.totalAmount || 0,
          slip.paymentMethod || 'Cash'
        ]);
      });

      const ws = XLSX.utils.aoa_to_sheet(wsData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Customer History');
      XLSX.writeFile(wb, `CustomerHistory_${historyData.customerName}_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      showNotification('success', 'Excel file downloaded successfully');
    } catch (err) {
      console.error('Error exporting to Excel:', err);
      showNotification('error', 'Failed to export to Excel');
    }
  };

  const clearFilters = () => {
    setSelectedMonth('');
    setSelectedYear('');
    setStartDate(null);
    setEndDate(null);
    if (historyData) {
      handleSearch();
    }
  };

  // Generate months and years for filters
  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3, md: 4 }, mb: 4, px: { xs: 1, sm: 2 } }}>
        {/* Header */}
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}>
          <Typography variant="h4" fontWeight="bold" sx={{ 
            mb: 2,
            fontSize: { xs: '1.5rem', sm: '2rem' }
          }}>
            Customer History
          </Typography>

          {/* Search Section - Only by Customer Name */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={10}>
              <Autocomplete
                freeSolo
                options={suggestions}
                value={searchQuery}
                onInputChange={(event, newValue) => {
                  if (typeof newValue === 'string') {
                    setSearchQuery(newValue);
                  } else {
                    setSearchQuery(newValue);
                  }
                }}
                onChange={(event, newValue) => {
                  if (newValue) {
                    setSearchQuery(newValue);
                  }
                }}
                getOptionLabel={(option) => {
                  if (typeof option === 'string') return option;
                  return option.label || option.value || '';
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search by Customer Name"
                    placeholder="e.g., Ali, Ahmed, etc."
                    fullWidth
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleSearch();
                    }}
                    size={isMobile ? 'small' : 'medium'}
                  />
                )}
                sx={{ flexGrow: 1 }}
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                startIcon={<SearchIcon />}
                onClick={handleSearch}
                disabled={loading || !searchQuery}
                fullWidth
                sx={{ height: '100%' }}
              >
                Search
              </Button>
            </Grid>
          </Grid>

          {/* Filters */}
          {historyData && (
            <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Month</InputLabel>
                    <Select
                      value={selectedMonth}
                      onChange={(e) => {
                        setSelectedMonth(e.target.value);
                        if (e.target.value && selectedYear) {
                          setTimeout(() => handleSearch(), 100);
                        }
                      }}
                      label="Month"
                    >
                      <MenuItem value="">All Months</MenuItem>
                      {months.map(m => (
                        <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Year</InputLabel>
                    <Select
                      value={selectedYear}
                      onChange={(e) => {
                        setSelectedYear(e.target.value);
                        if (e.target.value && selectedMonth) {
                          setTimeout(() => handleSearch(), 100);
                        }
                      }}
                      label="Year"
                    >
                      <MenuItem value="">All Years</MenuItem>
                      {years.map(y => (
                        <MenuItem key={y} value={y.toString()}>{y}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    variant="outlined"
                    startIcon={<DateRangeIcon />}
                    onClick={() => setDateRangeDialogOpen(true)}
                    fullWidth
                    size="small"
                  >
                    {startDate && endDate 
                      ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                      : 'Date Range'
                    }
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <Button
                    variant="outlined"
                    onClick={clearFilters}
                    fullWidth
                    size="small"
                  >
                    Clear Filters
                  </Button>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="Export to Excel">
                      <IconButton onClick={handleExportExcel} color="success">
                        <TableChartIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Export to PDF">
                      <IconButton onClick={handleExportPDF} color="error">
                        <PictureAsPdfIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>

        {/* Date Range Dialog */}
        <Dialog open={dateRangeDialogOpen} onClose={() => setDateRangeDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Select Date Range</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate ? startDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const newDate = e.target.value ? new Date(e.target.value) : null;
                    setStartDate(newDate);
                    if (newDate && endDate && newDate > endDate) {
                      setEndDate(null);
                    }
                  }}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate ? endDate.toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const newDate = e.target.value ? new Date(e.target.value) : null;
                    if (!startDate || (newDate && newDate >= startDate)) {
                      setEndDate(newDate);
                    } else {
                      showNotification('error', 'End date must be after start date');
                    }
                  }}
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ min: startDate ? startDate.toISOString().split('T')[0] : undefined }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setStartDate(null);
              setEndDate(null);
            }}>Clear</Button>
            <Button onClick={() => {
              setDateRangeDialogOpen(false);
              if (startDate || endDate) {
                setTimeout(() => handleSearch(), 100);
              }
            }} variant="contained">Apply</Button>
          </DialogActions>
        </Dialog>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* No Results */}
        {!loading && searchPerformed && !historyData && !error && (
          <Alert severity="info" sx={{ mb: 3 }}>
            No history found for "{searchQuery}"
          </Alert>
        )}

        {/* Results */}
        {historyData && (
          <>
            {/* Customer Profile Summary */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12}>
                <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                      <Box>
                        <Typography variant="h5" fontWeight="bold" color="white" sx={{ mb: 1 }}>
                          {historyData.customerName}
                        </Typography>
                        {historyData.customerPhone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PhoneIcon sx={{ color: 'white', fontSize: '1rem' }} />
                            <Typography variant="body2" color="white">
                              {historyData.customerPhone}
                            </Typography>
                          </Box>
                        )}
                        <Chip 
                          label={historyData.summary.customerType}
                          color={getCustomerTypeColor(historyData.summary.customerType)}
                          size="small"
                          sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                        />
                      </Box>
                      <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                        <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                          First Visit: {formatDate(historyData.summary.firstVisitDate)}
                        </Typography>
                        <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                          Last Visit: {formatDate(historyData.summary.lastVisitDate)}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <ReceiptIcon sx={{ color: 'white', opacity: 0.9 }} />
                      <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                        Total Visits
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="white">
                      {historyData.summary.totalSlips}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <ShoppingCartIcon sx={{ color: 'white', opacity: 0.9 }} />
                      <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                        Total Products
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="white">
                      {historyData.summary.totalProducts}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarMonthIcon sx={{ color: 'white', opacity: 0.9 }} />
                      <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                        Lifetime Spend
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="white">
                      {formatCurrency(historyData.summary.totalAmount)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <TrendingUpIcon sx={{ color: 'white', opacity: 0.9 }} />
                      <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                        Average Bill
                      </Typography>
                    </Box>
                    <Typography variant="h5" fontWeight="bold" color="white">
                      {formatCurrency(historyData.summary.averageBillValue)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Tabs for different views */}
            <Paper elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
              <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tab label="Daily Timeline" />
                <Tab label="Monthly Summary" />
                <Tab label="Top Products" />
                <Tab label="All Slips" />
              </Tabs>

              {/* Daily Timeline Tab */}
              {activeTab === 0 && historyData.daily && historyData.daily.length > 0 && (
                <Box sx={{ p: 2 }}>
                  {historyData.daily.map((day, index) => (
                    <Accordion key={index} defaultExpanded={index < 3}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {day.dateLabel}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Chip label={`${day.visitCount} Visit${day.visitCount > 1 ? 's' : ''}`} size="small" color="primary" />
                            <Chip label={`${day.totalProducts} Items`} size="small" color="secondary" />
                            <Chip label={formatCurrency(day.totalAmount)} size="small" color="success" />
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TableContainer>
                          <Table size={isMobile ? 'small' : 'medium'}>
                            <TableHead>
                              <TableRow>
                                <TableCell><strong>Slip #</strong></TableCell>
                                <TableCell><strong>Time</strong></TableCell>
                                <TableCell><strong>Items</strong></TableCell>
                                <TableCell><strong>Quantity</strong></TableCell>
                                <TableCell><strong>Amount</strong></TableCell>
                                <TableCell><strong>Payment</strong></TableCell>
                                <TableCell><strong>Action</strong></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {day.visits.map((slip) => (
                                <TableRow key={slip._id}>
                                  <TableCell>{slip.slipNumber || slip._id}</TableCell>
                                  <TableCell>{formatDate(slip.createdAt || slip.date)}</TableCell>
                                  <TableCell>{slip.products?.length || 0}</TableCell>
                                  <TableCell>
                                    {slip.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0}
                                  </TableCell>
                                  <TableCell>{formatCurrency(slip.totalAmount)}</TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={slip.paymentMethod || 'Cash'} 
                                      size="small" 
                                      color={slip.paymentMethod === 'Cash' ? 'default' : 'primary'}
                                    />
                                  </TableCell>
                                  <TableCell>
                                    <Button
                                      component={Link}
                                      to={`/slips/${slip._id}`}
                                      size="small"
                                      variant="outlined"
                                    >
                                      View
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}

              {/* Monthly Summary Tab */}
              {activeTab === 1 && historyData.monthly && historyData.monthly.length > 0 && (
                <Box sx={{ p: 2 }}>
                  {historyData.monthly.map((month, index) => (
                    <Accordion key={index} defaultExpanded={index === 0}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            {month.month}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 2 }}>
                            <Chip label={`${month.slipCount} Visits`} size="small" color="primary" />
                            <Chip label={`${month.totalProducts} Items`} size="small" color="secondary" />
                            <Chip label={formatCurrency(month.totalAmount)} size="small" color="success" />
                          </Box>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        <TableContainer>
                          <Table size={isMobile ? 'small' : 'medium'}>
                            <TableHead>
                              <TableRow>
                                <TableCell><strong>Slip #</strong></TableCell>
                                <TableCell><strong>Date</strong></TableCell>
                                <TableCell><strong>Items</strong></TableCell>
                                <TableCell><strong>Amount</strong></TableCell>
                                <TableCell><strong>Payment</strong></TableCell>
                                <TableCell><strong>Action</strong></TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {month.slips.map((slip) => (
                                <TableRow key={slip._id}>
                                  <TableCell>{slip.slipNumber || slip._id}</TableCell>
                                  <TableCell>{formatDate(slip.createdAt || slip.date)}</TableCell>
                                  <TableCell>
                                    {slip.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0}
                                  </TableCell>
                                  <TableCell>{formatCurrency(slip.totalAmount)}</TableCell>
                                  <TableCell>{slip.paymentMethod || 'Cash'}</TableCell>
                                  <TableCell>
                                    <Button
                                      component={Link}
                                      to={`/slips/${slip._id}`}
                                      size="small"
                                      variant="outlined"
                                    >
                                      View
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              )}

              {/* Top Products Tab */}
              {activeTab === 2 && historyData.topProducts && historyData.topProducts.length > 0 && (
                <Box sx={{ p: 2 }}>
                  <TableContainer>
                    <Table size={isMobile ? 'small' : 'medium'}>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Rank</strong></TableCell>
                          <TableCell><strong>Product Name</strong></TableCell>
                          <TableCell><strong>Type</strong></TableCell>
                          <TableCell><strong>Total Quantity</strong></TableCell>
                          <TableCell><strong>Total Amount</strong></TableCell>
                          <TableCell><strong>Times Purchased</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {historyData.topProducts.map((product, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Chip 
                                icon={<StarIcon />}
                                label={`#${index + 1}`}
                                color={index === 0 ? 'warning' : 'default'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{product.productName}</TableCell>
                            <TableCell>
                              <Chip 
                                label={product.productType || 'Cover'} 
                                size="small" 
                                color={product.productType === 'Plate' ? 'secondary' : product.productType === 'Form' ? 'info' : 'primary'}
                              />
                            </TableCell>
                            <TableCell>{product.quantity}</TableCell>
                            <TableCell>{formatCurrency(product.totalAmount)}</TableCell>
                            <TableCell>{product.slipCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* All Slips Tab */}
              {activeTab === 3 && historyData.allSlips && historyData.allSlips.length > 0 && (
                <Box sx={{ p: 2 }}>
                  <TableContainer>
                    <Table size={isMobile ? 'small' : 'medium'}>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Slip #</strong></TableCell>
                          <TableCell><strong>Date</strong></TableCell>
                          <TableCell><strong>Products</strong></TableCell>
                          <TableCell><strong>Total Amount</strong></TableCell>
                          <TableCell><strong>Payment Method</strong></TableCell>
                          <TableCell><strong>Action</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {historyData.allSlips.map((slip) => (
                          <TableRow key={slip._id}>
                            <TableCell>{slip.slipNumber || slip._id}</TableCell>
                            <TableCell>{formatDate(slip.createdAt || slip.date)}</TableCell>
                            <TableCell>
                              {slip.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0} items
                            </TableCell>
                            <TableCell>{formatCurrency(slip.totalAmount)}</TableCell>
                            <TableCell>
                              <Chip 
                                label={slip.paymentMethod || 'Cash'} 
                                size="small" 
                                color={slip.paymentMethod === 'Cash' ? 'default' : 'primary'}
                              />
                            </TableCell>
                            <TableCell>
                              <Button
                                component={Link}
                                to={`/slips/${slip._id}`}
                                size="small"
                                variant="contained"
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </Paper>
          </>
        )}
      </Container>
  );
};

export default CustomerHistoryEnhanced;

