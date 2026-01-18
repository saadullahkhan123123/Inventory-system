import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, IconButton, Chip, Alert,
  CircularProgress, Stack, Divider
} from '@mui/material';
import {
  Search, Refresh, Edit, Visibility, Cancel,
  Clear, LocalOffer, Save, Delete, Add // ✅ Added Add icon import
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { axiosApi } from '../utils/api';
import { useNotification } from '../utils/notifications';

const SearchSlip = () => {
  const navigate = useNavigate();
  const { notification, showNotification, hideNotification } = useNotification();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [allSlips, setAllSlips] = useState([]); // Store all slips from server
  const [searchResults, setSearchResults] = useState([]); // Filtered results to display
  const [loading, setLoading] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openCancelDialog, setOpenCancelDialog] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

  // Update search results when search term or allSlips changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults(allSlips);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    const filteredSlips = allSlips.filter(slip => {
      // Search in customer name
      if (slip.customerName?.toLowerCase().includes(term)) return true;
      
      // Search in slip number or ID
      if (slip.slipNumber?.toLowerCase().includes(term) || 
          slip._id?.toLowerCase().includes(term)) return true;
      
      // Search in product names
      if (slip.products?.some(p => 
        p.productName?.toLowerCase().includes(term)
      )) return true;
      
      // Search in customer phone
      if (slip.customerPhone?.toLowerCase().includes(term)) return true;
      
      return false;
    });

    setSearchResults(filteredSlips);
    
    if (filteredSlips.length === 0 && allSlips.length > 0) {
      showNotification('info', 'No slips found matching your search.');
    }
  }, [searchTerm, allSlips]);

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
      // searchResults will be updated by useEffect
    } catch (error) {
      console.error('Error fetching slips:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to load slips';
      const errorDetails = error.code === 'ECONNABORTED' 
        ? 'Request timeout - backend may be slow or unreachable'
        : error.message === 'Network Error'
        ? 'Network error - check if backend is running'
        : errorMsg;
      showNotification('error', `Failed to load slips: ${errorDetails}`);
      setAllSlips([]);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search button click
  const handleSearch = () => {
    // Search is handled automatically by useEffect
    // This function is kept for the button click handler
    if (!searchTerm.trim()) {
      fetchAllSlips();
    }
  };

  // Clear search and filters
  const clearSearch = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    // Results will update automatically via useEffect
  };

  // Open edit dialog and populate form
  const handleEditClick = (slip) => {
    // Prevent editing cancelled slips
    if (slip.status === 'Cancelled') {
      showNotification('warning', 'Cannot edit a cancelled slip. Please restore it first.');
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
        originalQuantity: product.quantity // Store original for inventory updates
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

  // Update slip with inventory adjustment
  const handleUpdateSlip = async () => {
    try {
      setLoading(true);

      // Validate products
      if (!editForm.products || editForm.products.length === 0) {
        showNotification('error', 'At least one product is required');
        return;
      }

      // Validate each product
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

      // Calculate new totals
      const subtotal = editForm.products.reduce((sum, product) => {
        const total = (product.quantity || 0) * (product.unitPrice || 0);
        return sum + total;
      }, 0);
      
      const tax = selectedSlip.tax || 0;
      const discount = selectedSlip.discount || 0;
      const totalAmount = subtotal - discount + tax;

      const updatedData = {
        customerName: editForm.customerName || 'Walk-in Customer',
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
        showNotification('success', 'Slip updated successfully! Inventory has been adjusted.');
        setOpenEditDialog(false);
        setSelectedSlip(null);
        // Refresh all slips
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

  // Cancel slip (mark as cancelled and adjust inventory)
  const handleCancelSlip = async () => {
    try {
      setLoading(true);

      // Check if already cancelled
      if (selectedSlip.status === 'Cancelled') {
        showNotification('warning', 'This slip is already cancelled.');
        setOpenCancelDialog(false);
        return;
      }

      // Use dedicated cancel endpoint for better synchronization
      const response = await axiosApi.slips.cancel(selectedSlip._id, 'Cancelled by admin');
      
      if (response.data) {
        const details = response.data.details || {};
        showNotification('success', 
          `Slip cancelled successfully! ${details.inventoryItemsRestored || 0} item(s) restored to inventory. ${details.incomeRecordsUpdated || 0} income record(s) updated.`
        );
        setOpenCancelDialog(false);
        setSelectedSlip(null);
        // Refresh all slips
        await fetchAllSlips();
      }
      
    } catch (error) {
      console.error('Cancel error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to cancel slip';
      const errorDetails = error.response?.data?.details || '';
      showNotification('error', `${errorMsg}${errorDetails ? `: ${errorDetails}` : ''}`);
    } finally {
      setLoading(false);
    }
  };

  // View slip details - FIXED: Check if route exists
  const handleViewSlip = (slipId) => {
    // Check if the individual slip page exists in your routes
    // If not, show details in a dialog instead
    try {
      navigate(`/slips/${slipId}`);
    } catch (error) {
      console.warn('Individual slip route not available, showing in dialog');
      // You can implement a view dialog here if needed
      showNotification('info', 'Individual slip view page is not available.');
    }
  };

  // Get payment method color
  const getPaymentMethodColor = (method) => {
    const colors = {
      'Cash': 'success',
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
      maxWidth: 1400, 
      mx: 'auto', 
      mt: { xs: 1, sm: 2 }, 
      p: { xs: 1.5, sm: 2, md: 3 },
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%)'
    }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ 
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 1,
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
        }}>
          Search & Manage Slips
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" sx={{
          fontSize: { xs: '0.875rem', sm: '1rem' },
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
        }}>
          Search by product name, customer, or slip ID. Edit details or cancel slips.
        </Typography>
      </Box>

      {/* Enhanced Search Section with Date Range */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: { xs: 2, sm: 3 },
        borderRadius: 3,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }} elevation={0}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={5}>
            <TextField
              fullWidth
              label="Search by Product Name, Customer, Phone, or Slip ID"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2.5}>
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
          <Grid item xs={12} sm={6} md={2.5}>
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              size="small"
              inputProps={{ 
                min: startDate || undefined 
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                startIcon={<Search />}
                onClick={handleSearch}
                disabled={loading}
                sx={{ flex: 1 }}
                size="small"
              >
                {loading ? <CircularProgress size={20} /> : 'Search'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={fetchAllSlips}
                size="small"
              >
                Refresh
              </Button>
              {(searchTerm || startDate || endDate) && (
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={clearSearch}
                  color="secondary"
                  size="small"
                >
                  Clear
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Section */}
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
                <TableCell><strong>Slip ID</strong></TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}><strong>Customer</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}><strong>Products</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Total</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {searchResults.map((slip) => (
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
                      {slip.slipNumber || slip._id}
                    </Typography>
                    <Chip
                      label={slip.paymentMethod}
                      color={getPaymentMethodColor(slip.paymentMethod)}
                      size="small"
                      sx={{ mt: 0.5, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                    />
                    <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 0.5 }}>
                      <Typography variant="caption" color="textSecondary">
                        {slip.customerName || 'Walk-in Customer'}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {slip.customerName || 'Walk-in Customer'}
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
                      {slip.products?.map((product, index) => (
                        <Typography key={index} variant="body2" noWrap sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          {product.productName} (x{product.quantity})
                        </Typography>
                      ))}
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Chip
                      label={slip.status || 'Paid'}
                      color={getStatusColor(slip.status)}
                      size="small"
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
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewSlip(slip._id)}
                        title="View Details"
                      >
                        <Visibility />
                      </IconButton>
                      
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleEditClick(slip)}
                        title="Edit Slip"
                        disabled={slip.status === 'Cancelled'}
                      >
                        <Edit />
                      </IconButton>
                      
                      {slip.status !== 'Cancelled' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setSelectedSlip(slip);
                            setOpenCancelDialog(true);
                          }}
                          title="Cancel Slip"
                        >
                          <Cancel />
                        </IconButton>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {searchResults.length === 0 && !loading && (
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
              {searchTerm ? 'Try a different search term' : 'No slips available. Create your first slip to get started!'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Edit Dialog */}
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
              {/* Customer Information */}
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

              {/* Products Section */}
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

              {/* Total Display */}
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
                <li>Mark the slip as <strong>"Cancelled"</strong> (status change)</li>
                <li>Return all products to inventory stock</li>
                <li>Remove the sale amount from income records</li>
                <li>Create an audit trail with cancellation timestamp</li>
                <li>Prevent duplicate cancellation</li>
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
                  <strong>Customer:</strong> {selectedSlip?.customerName || 'Walk-in Customer'}
                </Typography>
                <Typography variant="body2">
                  <strong>Total Amount:</strong> Rs {selectedSlip?.totalAmount?.toLocaleString()}
                </Typography>
                <Typography variant="body2">
                  <strong>Products:</strong> {selectedSlip?.products?.length || 0} item(s)
                </Typography>
                <Typography variant="body2">
                  <strong>Total Quantity:</strong> {selectedSlip?.products?.reduce((sum, p) => sum + (p.quantity || 0), 0) || 0} units
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
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Cancel Slip'}
          </Button>
        </DialogActions>
      </Dialog>

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
};

export default SearchSlip;