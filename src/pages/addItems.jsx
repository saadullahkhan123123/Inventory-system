import React, { useState } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid, 
  Snackbar, Alert, CircularProgress, Card, CardContent, useMediaQuery, useTheme, Tooltip,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import { axiosApi } from '../utils/api';
import { 
  getCompaniesForBike, 
  getPlateTypesForBikeAndCompany, 
  isValidPlateCombination 
} from '../utils/plateCombinations';
import {
  getFormTypesForCompany,
  getVariantsForCompanyAndType,
  getBikesForVariant,
  isValidFormCombination,
  FORM_COMPANIES,
  FORM_TYPES,
  FORM_BIKES
} from '../utils/formCombinations';

const AddItems = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [formData, setFormData] = useState({
    productType: 'Cover', // Cover, Form, or Plate
    coverType: '', // Only if productType is Cover
    plateCompany: '', // Only if productType is Plate
    bikeName: '', // Only if productType is Plate
    plateType: '', // Only if productType is Plate
    formCompany: '', // Only if productType is Form
    formType: '', // Only if productType is Form
    formVariant: '', // Only if productType is Form
    formBikeName: '', // Only if productType is Form (bike for form variant)
    price: '',
    basePrice: '',
    quantity: '',
    description: '',
    supplier: ''
  });

  // Cover types list
  const coverTypes = [
    'Aster Cover',
    'Without Aster Cover',
    'Color Cover',
    'Genuine Cover',
    'PC Cover',
    'Tissue Cover',
    'Belta Cover',
    'Line Cover',
    'Suzuki Cover',
    'Calendar Cover',
    'Seat Cushion'
  ];

  // Plate configuration
  const plateCompanies = ['DY', 'AH', 'BELTA'];
  const plateBikes = ['70', 'CD', '125', 'Yamaha', 'Plastic Plate'];

  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Check server status on component mount
  React.useEffect(() => {
    const checkServerStatus = async () => {
      try {
        // Test backend connection
        console.log('Testing server connection...');
        const testResponse = await axiosApi.testConnection();
        console.log('Backend test response:', testResponse.data);
        
        // Then try the API endpoint
        const response = await axiosApi.items.getAll();
        setServerStatus('online');
        console.log('Server is online, items loaded:', response.data);
      } catch (error) {
        setServerStatus('offline');
        console.error('Server connection failed:', error);
        console.error('Error details:', {
          message: error.message,
          code: error.code,
          response: error.response?.data,
          status: error.response?.status
        });
      }
    };
    
    checkServerStatus();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const showNotification = (severity, message) => {
    setNotification({ open: true, severity, message });
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const validateForm = () => {
    if (!formData.price || formData.price <= 0) {
      showNotification('error', 'Valid price is required');
      return false;
    }
    if (!formData.quantity || formData.quantity <= 0) {
      showNotification('error', 'Valid quantity is required');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Validation: If productType is Cover, coverType is required
      if (formData.productType === 'Cover' && !formData.coverType) {
        showNotification('error', 'Cover Type is required when Product Type is Cover');
        return;
      }

      // Validation: If productType is Plate, validate required fields
      if (formData.productType === 'Plate') {
        if (formData.bikeName === 'Plastic Plate') {
          // Plastic Plate is standalone, no validation needed
        } else {
          if (!formData.bikeName) {
            showNotification('error', 'Bike Name is required for Plate products (except Plastic Plate)');
            return;
          }
          if (!formData.plateType) {
            showNotification('error', 'Plate Type is required for Plate products (except Plastic Plate)');
            return;
          }
          // Validate combination
          if (formData.bikeName === '70' && !formData.plateCompany) {
            showNotification('error', 'Company is required for Bike 70');
            return;
          }
          // Check if combination is valid
          if (!isValidPlateCombination(formData.bikeName, formData.plateCompany, formData.plateType)) {
            showNotification('error', 'Invalid Plate combination. Please check Company, Bike, and Plate Type.');
            return;
          }
        }
      }

      // Validation: If productType is Form, validate required fields
      if (formData.productType === 'Form') {
        if (!formData.formCompany) {
          showNotification('error', 'Company is required for Form products');
          return;
        }
        if (!formData.formType) {
          showNotification('error', 'Form Type is required for Form products');
          return;
        }
        if (!formData.formVariant) {
          showNotification('error', 'Form Variant is required for Form products');
          return;
        }
        // Validate combination
        if (!isValidFormCombination(formData.formCompany, formData.formType, formData.formVariant, formData.formBikeName)) {
          showNotification('error', 'Invalid Form combination. Please check Company, Form Type, Variant, and Bike.');
          return;
        }
      }

      // Parse numeric values safely, defaulting to 0 if invalid
      const priceValue = parseFloat(formData.price) || 0;
      const basePriceValue = parseFloat(formData.basePrice) || priceValue || 0;
      const quantityValue = parseInt(formData.quantity) || 0;

      // Validate that price is provided and valid
      if (!formData.price || isNaN(priceValue) || priceValue < 0) {
        showNotification('error', 'Please enter a valid selling price');
        return;
      }

      // Build item data - only include relevant fields based on productType
      const itemData = {
        productType: formData.productType,
        price: priceValue,
        basePrice: basePriceValue,
        quantity: quantityValue,
        description: formData.description.trim() || '',
        supplier: formData.supplier.trim() || ''
      };

      // Only add productType-specific fields
      if (formData.productType === 'Cover') {
        itemData.coverType = formData.coverType;
      } else if (formData.productType === 'Plate') {
        itemData.plateCompany = formData.plateCompany;
        itemData.bikeName = formData.bikeName;
        itemData.plateType = formData.plateType;
      } else if (formData.productType === 'Form') {
        itemData.formCompany = formData.formCompany;
        itemData.formType = formData.formType;
        itemData.formVariant = formData.formVariant;
        itemData.bikeName = formData.formBikeName;
      }

      console.log('Sending item data:', itemData);
      console.log('API endpoint:', axiosApi.defaults.baseURL + '/items');
      
      const response = await axiosApi.items.create(itemData);
      
      console.log('API response:', response);
      
      if (response.data) {
        showNotification('success', 'Item added successfully!');
        // Reset form
        setFormData({
          productType: 'Cover',
          coverType: '',
          plateCompany: '',
          bikeName: '',
          plateType: '',
          formCompany: '',
          formType: '',
          formVariant: '',
          formBikeName: '',
          price: '',
          basePrice: '',
          quantity: '',
          description: '',
          supplier: ''
        });
      } else {
        showNotification('error', 'No data returned from server');
      }
    } catch (error) {
      console.error('Detailed error:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to add item. Please try again.';
      
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        errorMessage = 'Cannot connect to server. Please make sure your backend server is running.';
      } else if (error.response) {
        // Show the actual error message from backend
        const backendError = error.response.data?.error || error.response.data?.message || error.response.statusText;
        errorMessage = `Server error: ${error.response.status} - ${backendError}`;
        console.error('Backend error message:', backendError);
        console.error('Full error data:', JSON.stringify(error.response.data, null, 2));
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      marginTop: { xs: '56px', sm: '64px' }, 
      padding: { xs: 1, sm: 2, md: 4 }, 
      maxWidth: '1400px', 
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
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          mb: 1
        }}>
          Add New Item to Inventory
        </Typography>
        
        <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ 
          mb: { xs: 3, sm: 4 },
          fontSize: { xs: '0.875rem', sm: '1rem' },
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          px: { xs: 1, sm: 0 }
        }}>
          Fill in the details below to add a new item to your inventory
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {/* Product Type */}
            <Grid item xs={12} sm={6}>
              <Tooltip title="Select the product type. This determines pricing rules and available options." arrow placement="top">
                <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                  <InputLabel>Product Type *</InputLabel>
                  <Select
                    name="productType"
                    value={formData.productType}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        productType: e.target.value,
                        coverType: e.target.value !== 'Cover' ? '' : prev.coverType,
                        plateCompany: e.target.value !== 'Plate' ? '' : prev.plateCompany,
                        bikeName: e.target.value !== 'Plate' ? '' : prev.bikeName,
                        plateType: e.target.value !== 'Plate' ? '' : prev.plateType,
                        formCompany: e.target.value !== 'Form' ? '' : prev.formCompany,
                        formType: e.target.value !== 'Form' ? '' : prev.formType,
                        formVariant: e.target.value !== 'Form' ? '' : prev.formVariant,
                        formBikeName: e.target.value !== 'Form' ? '' : prev.formBikeName
                      }));
                    }}
                    label="Product Type *"
                  >
                    <MenuItem value="Cover">Cover</MenuItem>
                    <MenuItem value="Form">Form</MenuItem>
                    <MenuItem value="Plate">Plate</MenuItem>
                  </Select>
                </FormControl>
              </Tooltip>
            </Grid>

            {/* Cover Type - Only show if Product Type is Cover */}
            {formData.productType === 'Cover' && (
              <Grid item xs={12} sm={6}>
                <Tooltip title="Select the specific cover type. Required for Cover products." arrow placement="top">
                  <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                    <InputLabel>Cover Type *</InputLabel>
                    <Select
                      name="coverType"
                      value={formData.coverType}
                      onChange={handleInputChange}
                      label="Cover Type *"
                    >
                      {coverTypes.map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Tooltip>
              </Grid>
            )}

            {/* Plate Fields - Only show if Product Type is Plate */}
            {formData.productType === 'Plate' && (
              <>
                {/* Bike Name */}
                <Grid item xs={12} sm={6}>
                  <Tooltip title="Select the bike name. Required for Plate products (except Plastic Plate)." arrow placement="top">
                    <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                      <InputLabel>Bike Name *</InputLabel>
                      <Select
                        name="bikeName"
                        value={formData.bikeName}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            bikeName: e.target.value,
                            plateCompany: e.target.value === 'Plastic Plate' ? '' : prev.plateCompany,
                            plateType: e.target.value === 'Plastic Plate' ? '' : prev.plateType
                          }));
                        }}
                        label="Bike Name *"
                      >
                        {plateBikes.map(bike => (
                          <MenuItem key={bike} value={bike}>{bike}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Tooltip>
                </Grid>

                {/* Company - Only show if Bike requires company (Bike 70) */}
                {formData.bikeName === '70' && (
                  <Grid item xs={12} sm={6}>
                    <Tooltip title="Select company. Required for Bike 70." arrow placement="top">
                      <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                        <InputLabel>Company *</InputLabel>
                        <Select
                          name="plateCompany"
                          value={formData.plateCompany}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              plateCompany: e.target.value,
                              plateType: '' // Reset plate type when company changes
                            }));
                          }}
                          label="Company *"
                        >
                          {plateCompanies.map(company => (
                            <MenuItem key={company} value={company}>{company}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Tooltip>
                  </Grid>
                )}

                {/* Plate Type - Only show if not Plastic Plate */}
                {formData.bikeName && formData.bikeName !== 'Plastic Plate' && (
                  <Grid item xs={12} sm={6}>
                    <Tooltip title="Select plate type. Required for Plate products (except Plastic Plate)." arrow placement="top">
                      <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                        <InputLabel>Plate Type *</InputLabel>
                        <Select
                          name="plateType"
                          value={formData.plateType}
                          onChange={handleInputChange}
                          label="Plate Type *"
                          disabled={!formData.bikeName || (formData.bikeName === '70' && !formData.plateCompany)}
                        >
                          {getPlateTypesForBikeAndCompany(formData.bikeName, formData.plateCompany).map(type => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Tooltip>
                  </Grid>
                )}
              </>
            )}

            {/* Form Fields - Only show if Product Type is Form */}
            {formData.productType === 'Form' && (
              <>
                {/* Company */}
                <Grid item xs={12} sm={6}>
                  <Tooltip title="Select company. Required for Form products." arrow placement="top">
                    <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                      <InputLabel>Company *</InputLabel>
                      <Select
                        name="formCompany"
                        value={formData.formCompany}
                        onChange={(e) => {
                          setFormData(prev => ({
                            ...prev,
                            formCompany: e.target.value,
                            formType: '', // Reset form type when company changes
                            formVariant: '', // Reset variant
                            formBikeName: '' // Reset bike
                          }));
                        }}
                        label="Company *"
                      >
                        <MenuItem value="">Select Company</MenuItem>
                        {FORM_COMPANIES.map(company => (
                          <MenuItem key={company} value={company}>{company}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Tooltip>
                </Grid>

                {/* Form Type */}
                {formData.formCompany && (
                  <Grid item xs={12} sm={6}>
                    <Tooltip title="Select form type (Soft or Hard)." arrow placement="top">
                      <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                        <InputLabel>Form Type *</InputLabel>
                        <Select
                          name="formType"
                          value={formData.formType}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              formType: e.target.value,
                              formVariant: '', // Reset variant when type changes
                              formBikeName: '' // Reset bike
                            }));
                          }}
                          label="Form Type *"
                        >
                          <MenuItem value="">Select Form Type</MenuItem>
                          {getFormTypesForCompany(formData.formCompany).map(type => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Tooltip>
                  </Grid>
                )}

                {/* Form Variant */}
                {formData.formCompany && formData.formType && (
                  <Grid item xs={12} sm={6}>
                    <Tooltip title="Select form variant (weight, height, etc.)." arrow placement="top">
                      <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                        <InputLabel>Form Variant *</InputLabel>
                        <Select
                          name="formVariant"
                          value={formData.formVariant}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              formVariant: e.target.value,
                              formBikeName: '' // Reset bike when variant changes
                            }));
                          }}
                          label="Form Variant *"
                        >
                          <MenuItem value="">Select Variant</MenuItem>
                          {getVariantsForCompanyAndType(formData.formCompany, formData.formType).map(variant => (
                            <MenuItem key={variant} value={variant}>{variant}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Tooltip>
                  </Grid>
                )}

                {/* Bike Name - Only if variant requires specific bike */}
                {formData.formCompany && formData.formType && formData.formVariant && (
                  getBikesForVariant(formData.formCompany, formData.formType, formData.formVariant).length < FORM_BIKES.length && (
                    <Grid item xs={12} sm={6}>
                      <Tooltip title="Select bike name if required for this variant." arrow placement="top">
                        <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                          <InputLabel>Bike Name *</InputLabel>
                          <Select
                            name="formBikeName"
                            value={formData.formBikeName}
                            onChange={handleInputChange}
                            label="Bike Name *"
                          >
                            <MenuItem value="">Select Bike</MenuItem>
                            {getBikesForVariant(formData.formCompany, formData.formType, formData.formVariant).map(bike => (
                              <MenuItem key={bike} value={bike}>{bike}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Tooltip>
                    </Grid>
                  )
                )}
              </>
            )}


            {/* Base Price */}
            <Grid item xs={12} sm={6}>
              <Tooltip title="Base price for this product. This is the default price before any discounts." arrow placement="top">
              <TextField
                fullWidth
                  label="Base Price (Rs) *"
                  name="basePrice"
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      basePrice: value,
                      price: prev.price || value // Auto-fill price if empty
                    }));
                  }}
                required
                  inputProps={{ min: 0, step: "0.01" }}
                  placeholder="0.00"
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                    }
                  }}
                />
              </Tooltip>
            </Grid>

            {/* Selling Price */}
            <Grid item xs={12} sm={6}>
              <Tooltip title="Current selling price. Defaults to base price but can be adjusted." arrow placement="top">
              <TextField
                fullWidth
                  label="Selling Price (Rs) *"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                required
                inputProps={{ min: 0, step: "0.01" }}
                placeholder="0.00"
                  size={isMobile ? 'small' : 'medium'}
                  sx={{
                    '& .MuiInputBase-input': {
                      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                    }
                  }}
                />
              </Tooltip>
            </Grid>

            {/* Quantity */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Quantity *"
                name="quantity"
                type="number"
                value={formData.quantity}
                onChange={handleInputChange}
                required
                inputProps={{ min: 1 }}
                placeholder="1"
                defaultValue="1"
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                  }
                }}
              />
            </Grid>

            {/* Description - Optional */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Description (Optional)"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={2}
                placeholder="Add any additional notes or description"
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                  }
                }}
              />
            </Grid>

            {/* Supplier - Optional */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Supplier (Optional)"
                name="supplier"
                value={formData.supplier}
                onChange={handleInputChange}
                placeholder="Enter supplier name"
                size={isMobile ? 'small' : 'medium'}
                sx={{
                  '& .MuiInputBase-input': {
                    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                  }
                }}
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: { xs: 1, sm: 2 } }}>
                <Tooltip title="Add this item to your inventory. It will be available for slip creation." arrow>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                  disabled={loading || serverStatus === 'offline'}
                    sx={{ 
                      minWidth: { xs: '100%', sm: 200 },
                      py: { xs: 1.25, sm: 1.5 },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                      background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                      },
                      boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)'
                    }}
                >
                  {loading ? 'Adding Item...' : serverStatus === 'offline' ? 'Server Offline' : 'Add Item to Inventory'}
                </Button>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </form>

        
      </Paper>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddItems;
