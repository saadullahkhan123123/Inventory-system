import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid, Card, CardContent, CardActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, IconButton, Chip, Alert,
  CircularProgress, Stack, Divider, Tabs, Tab, Badge, Tooltip,
  useMediaQuery, useTheme, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import {
  Search, Refresh, Edit, Visibility, Cancel,
  Clear, Save, Delete, Add, FilterList, Sort,
  Download, ViewList, ViewModule, DateRange,
  AccountBalance, AttachMoney, Receipt
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { axiosApi } from '../utils/api';
import { useNotification } from '../utils/notifications';

const SearchSlip = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { notification, showNotification, hideNotification } = useNotification();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [allSlips, setAllSlips] = useState([]);
  const [filteredSlips, setFilteredSlips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('table');
  const [editForm, setEditForm] = useState({
    customerName: '',
    customerPhone: '',
    paymentMethod: '',
    notes: '',
    products: []
  });

  // Fetch all slips on component mount and when date filters change
  useEffect(() => {
    fetchAllSlips();
  }, [startDate, endDate]);

  // Filter and sort slips
  useEffect(() => {
    let filtered = [...allSlips];

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(slip => {
        if (slip.customerName?.toLowerCase().includes(term)) return true;
        if (slip.slipNumber?.toLowerCase().includes(term) || 
            slip._id?.toLowerCase().includes(term)) return true;
        if (slip.products?.some(p => 
            p.productName?.toLowerCase().includes(term)
        )) return true;
        if (slip.customerPhone?.toLowerCase().includes(term)) return true;
        return false;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(slip => slip.status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(slip => slip.paymentMethod === paymentFilter);
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
          aVal = a.totalAmount || 0;
          bVal = b.totalAmount || 0;
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

    setFilteredSlips(filtered);
  }, [searchTerm, allSlips, statusFilter, paymentFilter, sortBy, sortOrder]);

  // Fetch all slips with optional date range filter
  const fetchAllSlips = async () => {
    setLoading(true);
    try {
      const params = { limit: 1000 };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      
      const response = await axiosApi.slips.getAll(params);
      const slips = response.data.slips || response.data || [];
      const slipsArray = Array.isArray(slips) ? slips : [];
      setAllSlips(slipsArray);
    } catch (error) {
      console.error('Error fetching slips:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to load slips';
      showNotification('error', `Failed to load slips: ${errorMsg}`);
      setAllSlips([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const total = filteredSlips.length;
    const totalAmount = filteredSlips.reduce((sum, slip) => sum + (slip.totalAmount || 0), 0);
    const paid = filteredSlips.filter(s => s.status === 'Paid').length;
    const pending = filteredSlips.filter(s => s.status === 'Pending').length;
    const cancelled = filteredSlips.filter(s => s.status === 'Cancelled').length;
    return { total, totalAmount, paid, pending, cancelled };
  }, [filteredSlips]);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setSortBy('date');
    setSortOrder('desc');
  };

  // Open edit dialog and populate form
  const handleEditClick = (slip) => {
    if (slip.status === 'Cancelled') {
      showNotification('warning', 'Cannot edit a cancelled slip.');
      return;
    }

    setSelectedSlip(slip);
    setEditForm({
      customerName: slip.customerName || '',
      customerPhone: slip.customerPhone || '',
      paymentMethod: slip.paymentMethod || 'Cash',
      notes: slip.notes || '',
      products: slip.products?.map(product => ({
        productName: product.productName,
        quantity: product.quantity,
        unitPrice: product.unitPrice,
        totalPrice: product.totalPrice,
        basePrice: product.basePrice || product.unitPrice,
        productType: product.productType || 'Cover',
        coverType: product.coverType || '',
        plateCompany: product.plateCompany || '',
        bikeName: product.bikeName || '',
        plateType: product.plateType || '',
        formCompany: product.formCompany || '',
        formType: product.formType || '',
        formVariant: product.formVariant || '',
        category: product.category || '',
        subcategory: product.subcategory || '',
        company: product.company || '',
        originalQuantity: product.quantity
      })) || []
    });
    setOpenEditDialog(true);
  };

  // Handle form field changes
  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle product field changes
  const handleProductChange = (index, field, value) => {
    const updatedProducts = [...editForm.products];
    
    if (field === 'productName') {
      updatedProducts[index].productName = value;
    } else if (field === 'quantity') {
      const quantity = parseInt(value) || 0;
      updatedProducts[index].quantity = quantity;
      updatedProducts[index].totalPrice = quantity * updatedProducts[index].unitPrice;
    } else if (field === 'unitPrice') {
      const price = parseFloat(value) || 0;
      updatedProducts[index].unitPrice = price;
      updatedProducts[index].totalPrice = updatedProducts[index].quantity * price;
    }
    
    setEditForm(prev => ({
      ...prev,
      products: updatedProducts
    }));
  };

  // Add new product row
  const addProduct = () => {
    setEditForm(prev => ({
      ...prev,
      products: [...prev.products, { 
        productName: '', 
        quantity: 1, 
        unitPrice: 0, 
        totalPrice: 0 
      }]
    }));
  };

  // Remove product row
  const removeProduct = (index) => {
    if (editForm.products.length > 1) {
      const updatedProducts = editForm.products.filter((_, i) => i !== index);
      setEditForm(prev => ({
        ...prev,
        products: updatedProducts
      }));
    }
  };

  // Update slip
  const handleUpdateSlip = async () => {
    try {
      setLoading(true);

      if (!editForm.products || editForm.products.length === 0) {
        showNotification('error', 'At least one product is required');
        return;
      }

      for (const product of editForm.products) {
        if (!product.productName || !product.productName.trim()) {
          showNotification('error', 'All products must have a name');
          return;
        }
        if (!product.quantity || product.quantity <= 0) {
          showNotification('error', 'All products must have a valid quantity');
          return;
        }
        if (!product.unitPrice || product.unitPrice < 0) {
          showNotification('error', 'All products must have a valid price');
          return;
        }
      }

      const subtotal = editForm.products.reduce((sum, product) => {
        const total = (product.quantity || 0) * (product.unitPrice || 0);
        return sum + total;
      }, 0);
      
      const tax = selectedSlip.tax || 0;
      const discount = selectedSlip.discount || 0;
      const totalAmount = subtotal - discount + tax;

      const updatedData = {
        customerName: editForm.customerName.trim() || 'Walk Customer',
        customerPhone: editForm.customerPhone || '',
        paymentMethod: editForm.paymentMethod || 'Cash',
        notes: editForm.notes || '',
        products: editForm.products.map(product => ({
          productName: product.productName.trim(),
          quantity: parseInt(product.quantity),
          unitPrice: parseFloat(product.unitPrice),
          totalPrice: (parseInt(product.quantity) * parseFloat(product.unitPrice)),
          basePrice: parseFloat(product.basePrice || product.unitPrice),
          productType: product.productType || 'Cover',
          coverType: product.coverType || '',
          plateCompany: product.plateCompany || '',
          bikeName: product.bikeName || '',
          plateType: product.plateType || '',
          formCompany: product.formCompany || '',
          formType: product.formType || '',
          formVariant: product.formVariant || '',
          category: product.category || '',
          subcategory: product.subcategory || '',
          company: product.company || ''
        })),
        subtotal: subtotal,
        totalAmount: totalAmount,
        tax: tax,
        discount: discount,
        status: selectedSlip.status || 'Paid'
      };

      const response = await axiosApi.slips.update(selectedSlip._id, updatedData);
      
      if (response.data) {
        showNotification('success', 'Slip updated successfully!');
        setOpenEditDialog(false);
        setSelectedSlip(null);
        await fetchAllSlips();
      }
      
    } catch (error) {
      console.error('Update error:', error);
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.details || 
                          error.message || 
                          'Failed to update slip';
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Cancel slip
  const handleCancelSlip = async () => {
    try {
      setLoading(true);

      if (selectedSlip.status === 'Cancelled') {
        showNotification('warning', 'This slip is already cancelled.');
        setOpenCancelDialog(false);
        return;
      }

      const response = await axiosApi.slips.cancel(selectedSlip._id, 'Cancelled by admin');
      
      if (response.data) {
        const details = response.data.details || {};
        showNotification('success', 
          `Slip cancelled successfully! ${details.inventoryItemsRestored || 0} item(s) restored.`
        );
        setOpenCancelDialog(false);
        setSelectedSlip(null);
        await fetchAllSlips();
      }
      
    } catch (error) {
      console.error('Cancel error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to cancel slip';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Delete slip
  const handleDeleteSlip = async () => {
    try {
      setLoading(true);
      await axiosApi.slips.delete(selectedSlip._id);
      showNotification('success', 'Slip deleted successfully!');
      setOpenDeleteDialog(false);
      setSelectedSlip(null);
      await fetchAllSlips();
    } catch (error) {
      console.error('Delete error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to delete slip';
      showNotification('error', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // View slip details
  const handleViewSlip = (slipId) => {
    navigate(`/slips/${slipId}`);
  };

  // Get payment method color
  const getPaymentMethodColor = (method) => {
    const colors = {
      'Cash': 'success',
      'Udhar': 'warning',
      'Account': 'info',
      'Card': 'primary',
      'UPI': 'secondary',
      'Bank Transfer': 'info',
      'Credit': 'warning',
      'Other': 'default'
    };
    return colors[method] || 'default';
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'Paid': 'success',
      'Pending': 'warning',
      'Cancelled': 'error'
    };
    return colors[status] || 'default';
  };

  // Calculate total for display
  const calculateTotal = () => {
    return editForm.products.reduce((sum, product) => sum + (product.totalPrice || 0), 0);
  };

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
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ 
              background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 1,
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}>
              Search & Manage Slips
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}>
              Search, filter, and manage all sales slips
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(e, newMode) => newMode && setViewMode(newMode)}
              size="small"
            >
              <ToggleButton value="table">
                <ViewList fontSize="small" />
              </ToggleButton>
              <ToggleButton value="card">
                <ViewModule fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchAllSlips} disabled={loading}>
                <Refresh />
              </IconButton>
            </Tooltip>
          </Stack>
        </Box>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h4" fontWeight="bold">
                {stats.total}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Slips
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(245, 87, 108, 0.4)'
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h4" fontWeight="bold">
                Rs {stats.totalAmount.toLocaleString()}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Amount
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(79, 172, 254, 0.4)'
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h4" fontWeight="bold">
                {stats.paid}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Paid
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(250, 112, 154, 0.4)'
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h4" fontWeight="bold">
                {stats.pending}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Pending
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={4} md={2.4}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            color: 'white',
            boxShadow: '0 4px 15px rgba(48, 207, 208, 0.4)'
          }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="h4" fontWeight="bold">
                {stats.cancelled}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Cancelled
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: { xs: 2, sm: 3 },
        borderRadius: 3,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }} elevation={0}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search by Customer, Slip ID, Product, or Phone"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
              }}
              size={isMobile ? 'small' : 'medium'}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size={isMobile ? 'small' : 'medium'}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={2}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size={isMobile ? 'small' : 'medium'}
              inputProps={{ 
                min: startDate || undefined 
              }}
            />
          </Grid>
          <Grid item xs={6} sm={4} md={1.5}>
            <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={4} md={1.5}>
            <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
              <InputLabel>Payment</InputLabel>
              <Select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                label="Payment"
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Udhar">Udhar</MenuItem>
                <MenuItem value="Account">Account</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={4} md={1}>
            <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
              <InputLabel>Sort</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort"
              >
                <MenuItem value="date">Date</MenuItem>
                <MenuItem value="amount">Amount</MenuItem>
                <MenuItem value="customer">Customer</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={4} md={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              size={isMobile ? 'small' : 'medium'}
              startIcon={<Sort />}
            >
              {sortOrder === 'asc' ? 'ASC' : 'DESC'}
            </Button>
          </Grid>
          {(searchTerm || startDate || endDate || statusFilter !== 'all' || paymentFilter !== 'all') && (
            <Grid item xs={12} sm={12} md={1}>
              <Button
                fullWidth
                variant="outlined"
                startIcon={<Clear />}
                onClick={clearFilters}
                color="secondary"
                size={isMobile ? 'small' : 'medium'}
              >
                Clear
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>

      {/* Results */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : viewMode === 'table' ? (
        <Paper elevation={0} sx={{ 
          borderRadius: 3,
          overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
        }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ 
                  background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                  '& .MuiTableCell-head': {
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.95rem' },
                    padding: { xs: '8px', sm: '12px', md: '16px' }
                  }
                }}>
                  <TableCell>Slip ID</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Customer</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Products</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Payment</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSlips.map((slip) => (
                  <TableRow 
                    key={slip._id} 
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.04)',
                        transform: 'scale(1.01)',
                        transition: 'all 0.2s ease-in-out'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {slip.slipNumber || slip._id?.slice(-8)}
                      </Typography>
                      <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 0.5 }}>
                        <Typography variant="caption" color="textSecondary">
                          {slip.customerName || 'Walk Customer'}
                        </Typography>
                      </Box>
                    </TableCell>
                    
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Box>
                        <Typography variant="body2" fontWeight="medium">
                          {slip.customerName || 'Walk Customer'}
                        </Typography>
                        {slip.customerPhone && (
                          <Typography variant="caption" color="textSecondary">
                            {slip.customerPhone}
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                        {new Date(slip.date || slip.createdAt).toLocaleDateString()}
                      </Typography>
                      <Typography variant="caption" color="textSecondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                        {new Date(slip.date || slip.createdAt).toLocaleTimeString()}
                      </Typography>
                    </TableCell>
                    
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                      <Box sx={{ maxWidth: 200 }}>
                        {slip.products?.slice(0, 2).map((product, index) => (
                          <Typography key={index} variant="body2" noWrap sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {product.productName} (x{product.quantity})
                          </Typography>
                        ))}
                        {slip.products?.length > 2 && (
                          <Typography variant="caption" color="textSecondary">
                            +{slip.products.length - 2} more
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={slip.status || 'Paid'}
                        color={getStatusColor(slip.status)}
                        size="small"
                        sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Chip
                        label={slip.paymentMethod || 'Cash'}
                        color={getPaymentMethodColor(slip.paymentMethod)}
                        size="small"
                        sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                      />
                    </TableCell>
                    
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" sx={{ 
                        color: 'success.main',
                        fontSize: { xs: '0.875rem', sm: '1rem' }
                      }}>
                        Rs {slip.totalAmount?.toLocaleString()}
                      </Typography>
                    </TableCell>
                    
                    <TableCell>
                      <Stack direction="row" spacing={{ xs: 0.5, sm: 1 }} flexWrap="wrap">
                        <Tooltip title="View">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewSlip(slip._id)}
                          >
                            <Visibility fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            color="secondary"
                            onClick={() => handleEditClick(slip)}
                            disabled={slip.status === 'Cancelled'}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {slip.status !== 'Cancelled' && (
                          <>
                            <Tooltip title="Cancel">
                              <IconButton
                                size="small"
                                color="warning"
                                onClick={() => {
                                  setSelectedSlip(slip);
                                  setOpenCancelDialog(true);
                                }}
                              >
                                <Cancel fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setSelectedSlip(slip);
                                  setOpenDeleteDialog(true);
                                }}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredSlips.length === 0 && (
            <Box sx={{ 
              p: 6, 
              textAlign: 'center',
              background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
              borderRadius: 2
            }}>
              <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="textSecondary" fontWeight="medium">
                No slips found
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' 
                  ? 'Try adjusting your filters' 
                  : 'No slips available. Create your first slip to get started!'}
              </Typography>
            </Box>
          )}
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredSlips.map((slip) => (
            <Grid item xs={12} sm={6} md={4} key={slip._id}>
              <Card sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                }
              }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" fontWeight="bold" gutterBottom>
                        {slip.slipNumber || slip._id?.slice(-8)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {new Date(slip.date || slip.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                    <Chip
                      label={slip.status || 'Paid'}
                      color={getStatusColor(slip.status)}
                      size="small"
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Typography variant="body1" fontWeight="medium" gutterBottom>
                    {slip.customerName || 'Walk Customer'}
                  </Typography>
                  {slip.customerPhone && (
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      {slip.customerPhone}
                    </Typography>
                  )}
                  
                  <Box sx={{ display: 'flex', gap: 1, my: 2, flexWrap: 'wrap' }}>
                    <Chip
                      label={slip.paymentMethod || 'Cash'}
                      color={getPaymentMethodColor(slip.paymentMethod)}
                      size="small"
                    />
                    <Chip
                      label={`${slip.products?.length || 0} items`}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                    Products:
                  </Typography>
                  <Box sx={{ mb: 2, maxHeight: 100, overflow: 'auto' }}>
                    {slip.products?.slice(0, 3).map((product, index) => (
                      <Typography key={index} variant="caption" display="block" sx={{ mb: 0.5 }}>
                        • {product.productName} (x{product.quantity})
                      </Typography>
                    ))}
                    {slip.products?.length > 3 && (
                      <Typography variant="caption" color="textSecondary">
                        +{slip.products.length - 3} more
                      </Typography>
                    )}
                  </Box>
                  
                  <Typography variant="h6" fontWeight="bold" color="success.main" sx={{ mt: 'auto' }}>
                    Rs {slip.totalAmount?.toLocaleString()}
                  </Typography>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0, justifyContent: 'space-between' }}>
                  <Button
                    size="small"
                    startIcon={<Visibility />}
                    onClick={() => handleViewSlip(slip._id)}
                  >
                    View
                  </Button>
                  <Stack direction="row" spacing={0.5}>
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => handleEditClick(slip)}
                      disabled={slip.status === 'Cancelled'}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    {slip.status !== 'Cancelled' && (
                      <>
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => {
                            setSelectedSlip(slip);
                            setOpenCancelDialog(true);
                          }}
                        >
                          <Cancel fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedSlip(slip);
                            setOpenDeleteDialog(true);
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Stack>
                </CardActions>
              </Card>
            </Grid>
          ))}
          {filteredSlips.length === 0 && (
            <Grid item xs={12}>
              <Box sx={{ 
                p: 6, 
                textAlign: 'center',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
                borderRadius: 2
              }}>
                <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="textSecondary" fontWeight="medium">
                  No slips found
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  {searchTerm || statusFilter !== 'all' || paymentFilter !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'No slips available. Create your first slip to get started!'}
                </Typography>
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Edit Dialog - Keep existing implementation */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          }
        }}
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          fontWeight: 'bold'
        }}>
          Edit Slip - {selectedSlip?.slipNumber}
        </DialogTitle>
        <DialogContent>
          {selectedSlip && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                Customer Information
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    value={editForm.customerName}
                    onChange={(e) => handleEditFormChange('customerName', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Customer Phone"
                    value={editForm.customerPhone}
                    onChange={(e) => handleEditFormChange('customerPhone', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={editForm.paymentMethod}
                      onChange={(e) => handleEditFormChange('paymentMethod', e.target.value)}
                      label="Payment Method"
                    >
                      <MenuItem value="Cash">Cash</MenuItem>
                      <MenuItem value="Udhar">Udhar</MenuItem>
                      <MenuItem value="Account">Account</MenuItem>
                      <MenuItem value="Card">Card</MenuItem>
                      <MenuItem value="UPI">UPI</MenuItem>
                      <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                      <MenuItem value="Credit">Credit</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  Products
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<Add />} 
                  onClick={addProduct}
                  size="small"
                >
                  Add Product
                </Button>
              </Box>

              {editForm.products.map((product, index) => (
                <Card key={index} sx={{ 
                  mb: 2, 
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    borderColor: 'primary.main'
                  },
                  transition: 'all 0.2s ease-in-out'
                }} variant="outlined">
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={4}>
                      <TextField
                        fullWidth
                        label="Product Name"
                        value={product.productName}
                        onChange={(e) => handleProductChange(index, 'productName', e.target.value)}
                        placeholder="Enter product name"
                      />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Quantity"
                        value={product.quantity}
                        onChange={(e) => handleProductChange(index, 'quantity', e.target.value)}
                        inputProps={{ min: 1 }}
                      />
                    </Grid>
                    <Grid item xs={6} sm={2}>
                      <TextField
                        fullWidth
                        type="number"
                        label="Unit Price"
                        value={product.unitPrice}
                        onChange={(e) => handleProductChange(index, 'unitPrice', e.target.value)}
                        inputProps={{ min: 0, step: 0.01 }}
                      />
                    </Grid>
                    <Grid item xs={8} sm={3}>
                      <Typography variant="body2" fontWeight="bold">
                        Total: Rs {product.totalPrice?.toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={4} sm={1}>
                      {editForm.products.length > 1 && (
                        <IconButton
                          color="error"
                          onClick={() => removeProduct(index)}
                          size="small"
                        >
                          <Delete />
                        </IconButton>
                      )}
                    </Grid>
                  </Grid>
                </Card>
              ))}

              <Box sx={{ 
                p: 3, 
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                color: 'white', 
                borderRadius: 2, 
                mt: 3,
                boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)'
              }}>
                <Typography variant="h5" align="center" fontWeight="bold">
                  Grand Total: Rs {calculateTotal().toLocaleString()}
                </Typography>
              </Box>

              <TextField
                fullWidth
                label="Notes"
                value={editForm.notes}
                onChange={(e) => handleEditFormChange('notes', e.target.value)}
                multiline
                rows={2}
                sx={{ mt: 2 }}
                placeholder="Any additional notes or reasons for changes..."
              />

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Note:</strong> Changing product quantities or prices will automatically:
                </Typography>
                <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
                  <li>Restore old quantities to inventory</li>
                  <li>Deduct new quantities from inventory</li>
                  <li>Update income records with new amounts</li>
                  <li>Maintain data consistency across all systems</li>
                </Box>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Button 
            onClick={() => setOpenEditDialog(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            startIcon={<Save />}
            onClick={handleUpdateSlip}
            disabled={loading}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Slip Dialog */}
      <Dialog 
        open={openCancelDialog} 
        onClose={() => setOpenCancelDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Cancel Slip - {selectedSlip?.slipNumber}
        </DialogTitle>
        <DialogContent>
          {selectedSlip?.status === 'Cancelled' ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              This slip is already cancelled!
            </Alert>
          ) : (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                This action cannot be undone!
              </Alert>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Are you sure you want to cancel this slip? This will:
              </Typography>
              <Box component="ul" sx={{ pl: 2, mb: 2 }}>
                <li>Mark the slip as <strong>"Cancelled"</strong></li>
                <li>Return all products to inventory stock</li>
                <li>Remove the sale amount from income records</li>
                <li>Create an audit trail with cancellation timestamp</li>
              </Box>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'rgba(25, 118, 210, 0.1)', 
                borderRadius: 1,
                mb: 2 
              }}>
                <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
                  Slip Details:
                </Typography>
                <Typography variant="body2">
                  <strong>Slip #:</strong> {selectedSlip?.slipNumber || selectedSlip?._id}
                </Typography>
                <Typography variant="body2">
                  <strong>Customer:</strong> {selectedSlip?.customerName || 'Walk Customer'}
                </Typography>
                <Typography variant="body2">
                  <strong>Total Amount:</strong> Rs {selectedSlip?.totalAmount?.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Products:</strong> {selectedSlip?.products?.length || 0} item(s)
                </Typography>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCancelDialog(false)}>Keep Slip</Button>
          <Button 
            variant="contained"
            color="error"
            startIcon={<Cancel />}
            onClick={handleCancelSlip}
            disabled={loading || selectedSlip?.status === 'Cancelled'}
          >
            {loading ? <CircularProgress size={24} /> : 'Cancel Slip'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Slip Dialog */}
      <Dialog 
        open={openDeleteDialog} 
        onClose={() => setOpenDeleteDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Delete Slip - {selectedSlip?.slipNumber}
        </DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            This action cannot be undone!
          </Alert>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to permanently delete this slip? This will:
          </Typography>
          <Box component="ul" sx={{ pl: 2, mb: 2 }}>
            <li>Permanently delete the slip record</li>
            <li>Return all products to inventory stock</li>
            <li>Remove the sale amount from income records</li>
            <li>Update all related records</li>
          </Box>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'rgba(211, 47, 47, 0.1)', 
            borderRadius: 1,
            mb: 2 
          }}>
            <Typography variant="body2" fontWeight="bold" sx={{ mb: 1 }}>
              Slip Details:
            </Typography>
            <Typography variant="body2">
              <strong>Slip #:</strong> {selectedSlip?.slipNumber || selectedSlip?._id}
            </Typography>
            <Typography variant="body2">
              <strong>Customer:</strong> {selectedSlip?.customerName || 'Walk Customer'}
            </Typography>
            <Typography variant="body2">
              <strong>Total Amount:</strong> Rs {selectedSlip?.totalAmount?.toLocaleString()}
            </Typography>
            <Typography variant="body2">
              <strong>Products:</strong> {selectedSlip?.products?.length || 0} item(s)
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button 
            variant="contained"
            color="error"
            startIcon={<Delete />}
            onClick={handleDeleteSlip}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      {notification.open && (
        <Alert
          severity={notification.severity}
          onClose={hideNotification}
          sx={{ position: 'fixed', bottom: 16, right: 16, minWidth: 300, zIndex: 9999 }}
        >
          {notification.message}
        </Alert>
      )}
    </Box>
  );
};

export default SearchSlip;
