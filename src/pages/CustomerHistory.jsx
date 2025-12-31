import React, { useState, useEffect } from 'react';
import {
  Box, Container, Paper, Typography, TextField, Button, Grid, Card, CardContent,
  CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, Accordion, AccordionSummary, AccordionDetails, Autocomplete,
  useMediaQuery, useTheme, Divider, Stack
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { axiosApi } from '../utils/api';
import { useNotification } from '../utils/notifications';
import { Link } from 'react-router-dom';

const CustomerHistory = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const showNotification = useNotification();

  const [customerName, setCustomerName] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Fetch suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (customerName.length >= 2) {
        try {
          const response = await axiosApi.customerHistory.getSuggestions(customerName);
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
  }, [customerName]);

  const handleSearch = async () => {
    if (!customerName.trim()) {
      showNotification('error', 'Please enter a customer name');
      return;
    }

    setLoading(true);
    setError(null);
    setSearchPerformed(true);

    try {
      console.log('🔍 Searching for customer:', customerName.trim());
      const response = await axiosApi.customerHistory.getByCustomerName(customerName.trim());
      console.log('✅ Response received:', response.data);
      setHistoryData(response.data);
    } catch (err) {
      console.error('❌ Error fetching customer history:', err);
      console.error('❌ Error details:', {
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.config?.url,
        baseURL: err.config?.baseURL
      });
      
      const errorMessage = err.response?.data?.error || err.message || 'Failed to fetch customer history';
      setError(errorMessage);
      setHistoryData(null);
      
      // Show notification for better UX
      if (err.response?.status === 404) {
        const requestedUrl = err.config?.baseURL + err.config?.url;
        showNotification('error', `Route not found: ${requestedUrl}. Please check if backend is running and route is deployed.`);
      } else {
        showNotification('error', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (dateString) => {
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

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3, md: 4 }, mb: 4, px: { xs: 1, sm: 2 } }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ 
          mb: 2,
          fontSize: { xs: '1.5rem', sm: '2rem' },
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
        }}>
          Customer History
        </Typography>

        {/* Search Section */}
        <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'stretch', sm: 'flex-end' } }}>
          <Autocomplete
            freeSolo
            options={suggestions}
            value={customerName}
            onInputChange={(event, newValue) => setCustomerName(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search Customer Name"
                placeholder="e.g., Ali"
                fullWidth
                onKeyPress={handleKeyPress}
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                  }
                }}
              />
            )}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            startIcon={<SearchIcon />}
            onClick={handleSearch}
            disabled={loading || !customerName.trim()}
            sx={{
              borderRadius: 2,
              px: { xs: 2, sm: 4 },
              py: { xs: 1, sm: 1.5 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
            }}
          >
            Search
          </Button>
        </Box>
      </Paper>

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
          No history found for customer "{customerName}"
        </Alert>
      )}

      {/* Results */}
      {historyData && (
        <>
          {/* Summary Card */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <CardContent>
                  <Typography variant="body2" color="white" sx={{ opacity: 0.9, mb: 1 }}>
                    Customer Name
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="white">
                    {historyData.customerName}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <ReceiptIcon sx={{ color: 'white', opacity: 0.9 }} />
                    <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                      Total Slips
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
                      Total Amount
                    </Typography>
                  </Box>
                  <Typography variant="h5" fontWeight="bold" color="white">
                    {formatCurrency(historyData.summary.totalAmount)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Monthly History */}
          {historyData.monthly && historyData.monthly.length > 0 && (
            <Paper elevation={2} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Typography variant="h6" fontWeight="bold" color="white">
                  Monthly History
                </Typography>
              </Box>
              {historyData.monthly.map((month, index) => (
                <Accordion key={index} defaultExpanded={index === 0}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {month.month}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Chip label={`${month.slipCount} Slips`} size="small" color="primary" />
                        <Chip label={`${month.totalProducts} Products`} size="small" color="secondary" />
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
                            <TableCell><strong>Products</strong></TableCell>
                            <TableCell><strong>Amount</strong></TableCell>
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
                              <TableCell>
                                <Button
                                  component={Link}
                                  to={`/slips/${slip._id}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ borderRadius: 1 }}
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
            </Paper>
          )}

          {/* Weekly History */}
          {historyData.weekly && historyData.weekly.length > 0 && (
            <Paper elevation={2} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 2, background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <Typography variant="h6" fontWeight="bold" color="white">
                  Weekly History
                </Typography>
              </Box>
              {historyData.weekly.map((week, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', pr: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {week.week}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Chip label={`${week.slipCount} Slips`} size="small" color="primary" />
                        <Chip label={`${week.totalProducts} Products`} size="small" color="secondary" />
                        <Chip label={formatCurrency(week.totalAmount)} size="small" color="success" />
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
                            <TableCell><strong>Products</strong></TableCell>
                            <TableCell><strong>Amount</strong></TableCell>
                            <TableCell><strong>Action</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {week.slips.map((slip) => (
                            <TableRow key={slip._id}>
                              <TableCell>{slip.slipNumber || slip._id}</TableCell>
                              <TableCell>{formatDate(slip.createdAt || slip.date)}</TableCell>
                              <TableCell>
                                {slip.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0}
                              </TableCell>
                              <TableCell>{formatCurrency(slip.totalAmount)}</TableCell>
                              <TableCell>
                                <Button
                                  component={Link}
                                  to={`/slips/${slip._id}`}
                                  size="small"
                                  variant="outlined"
                                  sx={{ borderRadius: 1 }}
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
            </Paper>
          )}

          {/* Products Purchased */}
          {historyData.products && historyData.products.length > 0 && (
            <Paper elevation={2} sx={{ mb: 3, borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 2, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <Typography variant="h6" fontWeight="bold" color="white">
                  Products Purchased
                </Typography>
              </Box>
              <TableContainer>
                <Table size={isMobile ? 'small' : 'medium'}>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Product Name</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Total Quantity</strong></TableCell>
                      <TableCell><strong>Total Amount</strong></TableCell>
                      <TableCell><strong>Slips</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historyData.products.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell>{product.productName}</TableCell>
                        <TableCell>
                          <Chip 
                            label={product.productType || 'Cover'} 
                            size="small" 
                            color={product.productType === 'Plate' ? 'secondary' : product.productType === 'Form' ? 'info' : 'primary'}
                          />
                          {product.coverType && (
                            <Chip label={product.coverType} size="small" variant="outlined" sx={{ ml: 0.5 }} />
                          )}
                          {product.plateType && (
                            <Chip label={product.plateType} size="small" variant="outlined" sx={{ ml: 0.5 }} />
                          )}
                          {product.formVariant && (
                            <Chip label={product.formVariant} size="small" variant="outlined" sx={{ ml: 0.5 }} />
                          )}
                        </TableCell>
                        <TableCell>{product.quantity}</TableCell>
                        <TableCell>{formatCurrency(product.totalAmount)}</TableCell>
                        <TableCell>{product.slipCount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* All Slips */}
          {historyData.allSlips && historyData.allSlips.length > 0 && (
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 2, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                <Typography variant="h6" fontWeight="bold" color="white">
                  All Slips ({historyData.allSlips.length})
                </Typography>
              </Box>
              <TableContainer>
                <Table size={isMobile ? 'small' : 'medium'}>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Slip #</strong></TableCell>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Products</strong></TableCell>
                      <TableCell><strong>Total Amount</strong></TableCell>
                      <TableCell><strong>Payment</strong></TableCell>
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
                        <TableCell>{slip.paymentMethod || 'Cash'}</TableCell>
                        <TableCell>
                          <Button
                            component={Link}
                            to={`/slips/${slip._id}`}
                            size="small"
                            variant="contained"
                            sx={{ borderRadius: 1 }}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      )}
    </Container>
  );
};

export default CustomerHistory;

