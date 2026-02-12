import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  Snackbar, Alert, Card, CardContent, IconButton, CircularProgress, useMediaQuery, useTheme
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import { axiosApi } from '../utils/api';
import { useNotification } from '../utils/notifications';

const Slips = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    customerName: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ productId: '', quantity: 1 }]
  });

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState({ products: true, submission: false });
  const { notification, showNotification, hideNotification } = useNotification();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosApi.items.getAll({ limit: 1000 });
        const data = response.data?.items || response.data || [];
        setProducts(Array.isArray(data) ? data.filter(p => p.isActive !== false) : []);
      } catch (error) {
        console.error('Error fetching products:', error);
        showNotification('error', error.response?.data?.error || error.message || 'Failed to load products');
      } finally {
        setLoading(prev => ({ ...prev, products: false }));
      }
    };
    fetchProducts();
  }, [showNotification]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...formData.items];
    if (field === 'productId') {
      updated[index] = { ...updated[index], productId: value, quantity: updated[index].quantity || 1 };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setFormData(prev => ({ ...prev, items: updated }));
  };

  const addRow = () => {
    setFormData(prev => ({ ...prev, items: [...prev.items, { productId: '', quantity: 1 }] }));
  };

  const removeRow = (index) => {
    if (formData.items.length <= 1) return;
    setFormData(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const getProduct = (productId) => products.find(p => p._id === productId);
  const lineTotal = (item) => {
    const product = getProduct(item.productId);
    if (!product) return 0;
    const qty = Math.max(0, parseInt(item.quantity, 10) || 0);
    return qty * (product.price || 0);
  };
  const totalAmount = formData.items.reduce((sum, item) => sum + lineTotal(item), 0);

  const validateForm = () => {
    if (!formData.customerName.trim()) {
      showNotification('error', 'Enter customer name.');
      return false;
    }
    for (let i = 0; i < formData.items.length; i++) {
      const item = formData.items[i];
      if (!item.productId) {
        showNotification('error', 'Select a product for every row.');
        return false;
      }
      const qty = parseInt(item.quantity, 10);
      if (isNaN(qty) || qty < 1) {
        showNotification('error', 'Quantity must be at least 1.');
        return false;
      }
      const product = getProduct(item.productId);
      if (product && (product.quantity || 0) < qty) {
        showNotification('error', `Not enough stock for "${product.name || 'product'}". Available: ${product.quantity || 0}`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(prev => ({ ...prev, submission: true }));
    try {
      const productsPayload = formData.items
        .filter(item => item.productId)
        .map(item => {
          const product = getProduct(item.productId);
          const qty = Math.max(1, parseInt(item.quantity, 10) || 0);
          const unitPrice = product ? (product.price || 0) : 0;
          const totalPrice = qty * unitPrice;
          return {
            productName: product ? (product.name || '') : '',
            quantity: qty,
            unitPrice,
            totalPrice,
            productType: (product && product.productType) || 'Cover',
            coverType: (product && product.coverType) || '',
            plateCompany: (product && product.plateCompany) || '',
            bikeName: (product && product.bikeName) || '',
            plateType: (product && product.plateType) || '',
            formCompany: (product && product.formCompany) || '',
            formType: (product && product.formType) || '',
            formVariant: (product && product.formVariant) || '',
            category: (product && product.category) || '',
            subcategory: (product && product.subcategory) || '',
            company: (product && product.company) || ''
          };
        });

      const slipData = {
        customerName: formData.customerName.trim() || 'Walk Customer',
        paymentMethod: 'Cash',
        products: productsPayload,
        subtotal: totalAmount,
        discount: 0,
        totalAmount,
        partialPayment: 0
      };

      const response = await axiosApi.slips.create(slipData);
      const createdSlip = response.data;

      showNotification('success', 'Slip created successfully!');
      navigate(`/slips/${createdSlip.slip._id}`);

      setFormData({
        customerName: '',
        date: new Date().toISOString().split('T')[0],
        items: [{ productId: '', quantity: 1 }]
      });
    } catch (err) {
      console.error('Slip creation error:', err);
      showNotification('error', err.response?.data?.error || err.message || 'Failed to create slip');
    } finally {
      setLoading(prev => ({ ...prev, submission: false }));
    }
  };

  if (loading.products) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading products...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      maxWidth: 900,
      mx: 'auto',
      mt: { xs: 0.5, sm: 1, md: 2 },
      p: { xs: 1, sm: 1.5, md: 3 },
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%)',
      pb: { xs: 2, sm: 3 }
    }}>
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" fontWeight="bold" sx={{
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 1,
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
        }}>
          Create Slip
        </Typography>
        <Typography variant="subtitle1" color="textSecondary">
          Customer, products, quantity. Total is calculated automatically.
        </Typography>
      </Box>

      <Paper sx={{
        p: { xs: 1.5, sm: 2.5, md: 3 },
        borderRadius: { xs: 2, sm: 3 },
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }} elevation={0}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Customer Name *"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                required
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleInputChange}
                size={isMobile ? 'small' : 'medium'}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight="bold">Products</Typography>
                <Button variant="outlined" size="small" startIcon={<AddIcon />} onClick={addRow}>
                  Add row
                </Button>
              </Box>
            </Grid>

            {formData.items.map((item, index) => {
              const product = getProduct(item.productId);
              const unitPrice = product ? (product.price || 0) : 0;
              const qty = Math.max(0, parseInt(item.quantity, 10) || 0);
              const lineTotalVal = qty * unitPrice;

              return (
                <Grid item xs={12} key={index}>
                  <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={5}>
                          <FormControl fullWidth size="small" required>
                            <InputLabel>Product *</InputLabel>
                            <Select
                              value={item.productId}
                              onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                              label="Product *"
                            >
                              <MenuItem value="">Select product</MenuItem>
                              {products.map(p => (
                                <MenuItem key={p._id} value={p._id}>
                                  {p.name || 'Unnamed'} — Rs {(p.price || 0).toLocaleString()} (Stock: {p.quantity ?? 0})
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <TextField
                            fullWidth
                            label="Quantity *"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                            inputProps={{ min: 1 }}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={6} sm={2}>
                          <Typography variant="body2" color="text.secondary">Unit: Rs {unitPrice.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={10} sm={2}>
                          <Typography variant="body2" fontWeight="bold">Total: Rs {lineTotalVal.toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={2} sm={1}>
                          <IconButton
                            color="error"
                            onClick={() => removeRow(index)}
                            disabled={formData.items.length === 1}
                            size="small"
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}

            <Grid item xs={12}>
              <Card sx={{
                p: 2,
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                color: 'white',
                borderRadius: 2
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Total Amount</Typography>
                  <Typography variant="h5" fontWeight="bold">Rs {totalAmount.toLocaleString()}</Typography>
                </Box>
              </Card>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  endIcon={<SendIcon />}
                  disabled={loading.submission || totalAmount <= 0}
                  sx={{
                    minWidth: 200,
                    py: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)' }
                  }}
                >
                  {loading.submission ? <CircularProgress size={24} color="inherit" /> : 'Create Slip'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar open={notification.open} autoHideDuration={5000} onClose={hideNotification}>
        <Alert severity={notification.severity} onClose={hideNotification}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Slips;
