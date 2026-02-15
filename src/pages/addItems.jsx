import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid,
  Snackbar, Alert, CircularProgress, FormControl, InputLabel, Select, MenuItem,
  useMediaQuery, useTheme
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { axiosApi } from '../utils/api';

const DEFAULT_CATEGORIES = ['General', 'Cover', 'Form', 'Plate', 'Accessories', 'Parts', 'Other'];

const AddItems = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [formData, setFormData] = useState({
    productName: '',
    category: 'General',
    subcategory: ''
  });

  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        await axiosApi.testConnection();
        await axiosApi.items.getAll();
        setServerStatus('online');
      } catch (error) {
        setServerStatus('offline');
      }
    };
    checkServerStatus();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showNotification = (severity, message) => {
    setNotification({ open: true, severity, message });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const productName = (formData.productName || '').trim();
    if (!productName) {
      showNotification('error', 'Product name is required');
      return;
    }

    setLoading(true);
    try {
      const itemData = {
        name: productName,
        category: formData.category || 'General',
        subcategory: (formData.subcategory || '').trim(),
        price: 0,
        quantity: 0,
        isActive: true
      };

      await axiosApi.items.create(itemData);
      showNotification('success', 'Product added successfully!');
      setFormData({
        productName: '',
        category: 'General',
        subcategory: ''
      });
    } catch (error) {
      const errorMessage = error.userMessage
        || error.response?.data?.error
        || error.message
        || 'Failed to add product. Please try again.';
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      marginTop: { xs: '56px', sm: '64px' },
      padding: { xs: 1, sm: 2, md: 4 },
      maxWidth: '800px',
      mx: 'auto',
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%)',
      pb: { xs: 2, sm: 3 }
    }}>
      <Paper elevation={0} sx={{
        p: { xs: 1.5, sm: 2.5, md: 4 },
        borderRadius: { xs: 2, sm: 3 },
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        mx: { xs: 0.5, sm: 0 }
      }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" sx={{
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          mb: 1
        }}>
          Add New Product
        </Typography>
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 3 }}>
          Product name, category, and subcategory.
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Product Name *"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                required
                placeholder="e.g. Aster Cover, Oil Seal"
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  label="Category"
                >
                  {DEFAULT_CATEGORIES.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sub Category"
                name="subcategory"
                value={formData.subcategory}
                onChange={handleInputChange}
                placeholder="e.g. Bike 70, Soft Form"
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                  disabled={loading || serverStatus === 'offline'}
                  sx={{
                    minWidth: { xs: '100%', sm: 220 },
                    py: 1.25,
                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    '&:hover': { background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)' }
                  }}
                >
                  {loading ? 'Adding…' : serverStatus === 'offline' ? 'Server Offline' : 'Add Product'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity} variant="filled" sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddItems;
