import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert, Stack, TextField, IconButton, Tooltip,
  FormControl, InputLabel, Select, MenuItem, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, Divider, useMediaQuery, useTheme
} from '@mui/material';
import {
  Search, Refresh, Clear, Warning, Edit, Save, Cancel,
  Inventory as InventoryIcon, ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import { axiosApi } from '../utils/api';
import { useNotification } from '../utils/notifications';
import HelpTooltip from '../components/HelpTooltip';
import GettingStarted from '../components/GettingStarted';
import { 
  getCompaniesForBike, 
  getPlateTypesForBikeAndCompany, 
  isValidPlateCombination,
  PLATE_COMPANIES,
  PLATE_BIKES
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

export default function Inventory() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedItem, setSelectedItem] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [updating, setUpdating] = useState(false);
  const { notification, showNotification, hideNotification } = useNotification();

  // Fetch items
  useEffect(() => {
    fetchItems();
  }, [categoryFilter, lowStockFilter]);

  const fetchItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        limit: 1000,
        search: searchTerm,
        category: categoryFilter,
        lowStock: lowStockFilter
      };
      const response = await axiosApi.items.getAll(params);
      setItems(response.data?.items || []);
      setCategories(response.data?.categories || []);
    } catch (err) {
      console.error('Error fetching items:', err);
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load inventory items';
      setError(`Failed to load inventory items: ${errorMsg}`);
      showNotification('error', `Failed to load inventory items: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort items
  let filteredItems = items.filter(item => {
    if (searchTerm && !item.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !item.sku?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  // Sort items
  filteredItems = [...filteredItems].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase();
      bVal = bVal.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    }
  });

  // Calculate statistics
  const stats = {
    totalItems: filteredItems.length,
    totalValue: filteredItems.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 0)), 0),
    lowStock: filteredItems.filter(item => (item.quantity || 0) <= 10).length,
    outOfStock: filteredItems.filter(item => (item.quantity || 0) === 0).length
  };

  // Get stock status color
  const getStockColor = (quantity) => {
    if (quantity === 0) return 'error';
    if (quantity <= 10) return 'warning';
    return 'success';
  };

  // Get stock status text
  const getStockStatus = (quantity) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= 10) return 'Low Stock';
    return 'In Stock';
  };

  // Handle edit click
  const handleEditClick = (item) => {
    setSelectedItem(item);
    setEditForm({
      name: item.name || '',
      sku: item.sku || '',
      productType: item.productType || 'Cover',
      coverType: item.coverType || '',
      plateCompany: item.plateCompany || '',
      bikeName: item.bikeName || '',
      plateType: item.plateType || '',
      formCompany: item.formCompany || '',
      formType: item.formType || '',
      formVariant: item.formVariant || '',
      category: item.category || 'General',
      subcategory: item.subcategory || '',
      company: item.company || '',
      quantity: item.quantity || 0,
      price: item.price || 0,
      basePrice: item.basePrice || item.price || 0,
      description: item.description || '',
      minStockLevel: item.minStockLevel || 10,
      maxStockLevel: item.maxStockLevel || 1000,
      costPrice: item.costPrice || 0
    });
    setOpenEditDialog(true);
  };

  // Handle form change
  const handleFormChange = (field, value) => {
    setEditForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Clear dependent fields when productType changes
      if (field === 'productType') {
        if (value === 'Cover') {
          updated.plateCompany = '';
          updated.bikeName = '';
          updated.plateType = '';
          updated.formCompany = '';
          updated.formType = '';
          updated.formVariant = '';
        } else if (value === 'Plate') {
          updated.coverType = '';
          updated.formCompany = '';
          updated.formType = '';
          updated.formVariant = '';
        } else if (value === 'Form') {
          updated.coverType = '';
          updated.plateCompany = '';
          updated.bikeName = '';
          updated.plateType = '';
        }
      }
      
      // Auto-fill basePrice from price if basePrice is empty
      if (field === 'price' && (!prev.basePrice || prev.basePrice === 0)) {
        updated.basePrice = value || 0;
      }
      
      return updated;
    });
  };

  // Handle update
  const handleUpdate = async () => {
    try {
      setUpdating(true);

      // Validation
      if (!editForm.price || editForm.price < 0) {
        showNotification('error', 'Valid price is required');
        return;
      }
      if (editForm.quantity < 0) {
        showNotification('error', 'Quantity cannot be negative');
        return;
      }

      // Product type specific validation
      if (editForm.productType === 'Cover' && !editForm.coverType) {
        showNotification('error', 'Cover Type is required for Cover products');
        return;
      }

      if (editForm.productType === 'Plate') {
        if (editForm.bikeName === 'Plastic Plate') {
          // Plastic Plate is standalone
        } else {
          if (!editForm.bikeName) {
            showNotification('error', 'Bike Name is required for Plate products');
            return;
          }
          if (!editForm.plateType) {
            showNotification('error', 'Plate Type is required for Plate products');
            return;
          }
          if (editForm.bikeName === '70' && !editForm.plateCompany) {
            showNotification('error', 'Company is required for Bike 70');
            return;
          }
          if (!isValidPlateCombination(editForm.bikeName, editForm.plateCompany, editForm.plateType)) {
            showNotification('error', 'Invalid Plate combination');
            return;
          }
        }
      }

      if (editForm.productType === 'Form') {
        if (!editForm.formCompany) {
          showNotification('error', 'Company is required for Form products');
          return;
        }
        if (!editForm.formType) {
          showNotification('error', 'Form Type is required for Form products');
          return;
        }
        if (!editForm.formVariant) {
          showNotification('error', 'Form Variant is required for Form products');
          return;
        }
        if (!isValidFormCombination(editForm.formCompany, editForm.formType, editForm.formVariant, editForm.bikeName)) {
          showNotification('error', 'Invalid Form combination');
          return;
        }
      }

      const updateData = {
        name: editForm.name.trim(),
        sku: editForm.sku.trim().toUpperCase(),
        productType: editForm.productType,
        coverType: editForm.productType === 'Cover' ? editForm.coverType : '',
        plateCompany: editForm.productType === 'Plate' ? editForm.plateCompany : '',
        bikeName: editForm.productType === 'Plate' ? editForm.bikeName : (editForm.productType === 'Form' ? editForm.bikeName : ''),
        plateType: editForm.productType === 'Plate' ? editForm.plateType : '',
        formCompany: editForm.productType === 'Form' ? editForm.formCompany : '',
        formType: editForm.productType === 'Form' ? editForm.formType : '',
        formVariant: editForm.productType === 'Form' ? editForm.formVariant : '',
        category: editForm.category || 'General',
        subcategory: editForm.subcategory || '',
        company: editForm.company || '',
        quantity: parseInt(editForm.quantity) || 0,
        price: parseFloat(editForm.price) || 0,
        basePrice: parseFloat(editForm.basePrice) || parseFloat(editForm.price) || 0,
        description: editForm.description.trim() || '',
        minStockLevel: parseInt(editForm.minStockLevel) || 10,
        maxStockLevel: parseInt(editForm.maxStockLevel) || 1000,
        costPrice: parseFloat(editForm.costPrice) || 0
      };

      await axiosApi.items.update(selectedItem._id, updateData);
      showNotification('success', 'Item updated successfully!');
      setOpenEditDialog(false);
      setSelectedItem(null);
      await fetchItems();
    } catch (error) {
      console.error('Update error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to update item';
      showNotification('error', errorMsg);
    } finally {
      setUpdating(false);
    }
  };

  // Quick stock update
  const handleQuickStockUpdate = async (itemId, newQuantity) => {
    try {
      await axiosApi.items.updateStock(itemId, { quantity: parseInt(newQuantity), operation: 'set' });
      showNotification('success', 'Stock updated successfully!');
      await fetchItems();
    } catch (error) {
      console.error('Stock update error:', error);
      const errorMsg = error.response?.data?.error || error.message || 'Failed to update stock';
      showNotification('error', errorMsg);
    }
  };

  if (loading && items.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading inventory...</Typography>
      </Box>
    );
  }

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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h4" sx={{ 
            mb: 1, 
            fontWeight: 'bold',
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
          }}>
            Inventory Management
          </Typography>
          <HelpTooltip 
            title="Inventory Management Help"
            content="View and edit your inventory items. Click Edit to update item details or stock."
          />
        </Box>
        <Typography variant="subtitle1" color="textSecondary">
          View and manage inventory items. Edit items to update details or stock levels.
        </Typography>
      </Box>

      <GettingStarted />

      {/* Statistics Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>Total Items</Typography>
              <Typography variant="h4" fontWeight="bold">{stats.totalItems}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 4px 15px rgba(245, 87, 108, 0.3)'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>Total Value</Typography>
              <Typography variant="h4" fontWeight="bold">Rs {stats.totalValue.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 4px 15px rgba(250, 112, 154, 0.3)'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>Low Stock</Typography>
              <Typography variant="h4" fontWeight="bold">{stats.lowStock}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            color: 'white',
            borderRadius: 3,
            boxShadow: '0 4px 15px rgba(48, 207, 208, 0.3)'
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>Out of Stock</Typography>
              <Typography variant="h4" fontWeight="bold">{stats.outOfStock}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Paper sx={{ 
        p: { xs: 1.5, sm: 2, md: 3 }, 
        mb: { xs: 2, sm: 3 },
        borderRadius: { xs: 2, sm: 3 },
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
          <Grid item xs={12} sm={12} md={4}>
            <TextField
              fullWidth
              label="Search Items"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchItems()}
              InputProps={{
                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
              }}
              size="small"
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <Button
              fullWidth
              variant={lowStockFilter ? 'contained' : 'outlined'}
              onClick={() => setLowStockFilter(!lowStockFilter)}
              startIcon={<Warning />}
              size="small"
            >
              Low Stock
            </Button>
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="price">Price</MenuItem>
                <MenuItem value="quantity">Stock</MenuItem>
                <MenuItem value="category">Category</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={6} md={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              size="small"
              startIcon={sortOrder === 'asc' ? <ArrowUpward /> : <ArrowDownward />}
            >
              {sortOrder === 'asc' ? 'ASC' : 'DESC'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={12} md={1}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'center', md: 'flex-start' }}>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchItems} size="small">
                  <Refresh />
                </IconButton>
              </Tooltip>
              {searchTerm && (
                <IconButton onClick={() => setSearchTerm('')} size="small">
                  <Clear />
                </IconButton>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Items Table */}
      <Paper elevation={0} sx={{ 
        borderRadius: 3,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <TableContainer sx={{ maxHeight: { xs: '70vh', md: '80vh' }, overflow: 'auto' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ 
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                '& .MuiTableCell-head': {
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: { xs: '0.7rem', sm: '0.75rem', md: '0.85rem' }
                }
              }}>
                <TableCell>Item Name</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>SKU</TableCell>
                <TableCell>Product Type</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Details</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow 
                  key={item._id}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                      transition: 'all 0.2s ease-in-out'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {item.name || 'Unnamed Item'}
                    </Typography>
                    {item.sku && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: { xs: 'block', sm: 'none' } }}>
                        SKU: {item.sku}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Typography variant="body2">{item.sku || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.productType || 'Cover'} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {item.productType === 'Cover' && item.coverType && (
                        <Chip label={item.coverType} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                      )}
                      {item.productType === 'Plate' && (
                        <>
                          {item.bikeName && <Typography variant="caption">Bike: {item.bikeName}</Typography>}
                          {item.plateCompany && <Typography variant="caption">Company: {item.plateCompany}</Typography>}
                          {item.plateType && <Typography variant="caption">Type: {item.plateType}</Typography>}
                        </>
                      )}
                      {item.productType === 'Form' && (
                        <>
                          {item.formCompany && <Typography variant="caption">Company: {item.formCompany}</Typography>}
                          {item.formType && <Typography variant="caption">Type: {item.formType}</Typography>}
                          {item.formVariant && <Typography variant="caption">Variant: {item.formVariant}</Typography>}
                          {item.bikeName && <Typography variant="caption">Bike: {item.bikeName}</Typography>}
                        </>
                      )}
                      {item.subcategory && <Typography variant="caption">Sub: {item.subcategory}</Typography>}
                      {item.company && <Typography variant="caption">Company: {item.company}</Typography>}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.category || 'General'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      Rs {item.price?.toLocaleString() || '0'}
                    </Typography>
                    {item.basePrice && item.basePrice !== item.price && (
                      <Typography variant="caption" color="textSecondary">
                        Base: Rs {item.basePrice.toLocaleString()}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {item.quantity || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStockStatus(item.quantity || 0)}
                      color={getStockColor(item.quantity || 0)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit Item">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEditClick(item)}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredItems.length === 0 && (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <InventoryIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" color="textSecondary">
              No items found
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              {searchTerm ? 'Try a different search term' : 'Add items to get started'}
            </Typography>
          </Box>
        )}
      </Paper>

      {/* Edit Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)}
        maxWidth="md"
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
          Edit Item - {selectedItem?.name || 'Unnamed Item'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            {/* Basic Info */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Item Name"
                value={editForm.name || ''}
                onChange={(e) => handleFormChange('name', e.target.value)}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SKU"
                value={editForm.sku || ''}
                onChange={(e) => handleFormChange('sku', e.target.value.toUpperCase())}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>

            {/* Product Type */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                <InputLabel>Product Type *</InputLabel>
                <Select
                  value={editForm.productType || 'Cover'}
                  onChange={(e) => handleFormChange('productType', e.target.value)}
                  label="Product Type *"
                >
                  <MenuItem value="Cover">Cover</MenuItem>
                  <MenuItem value="Form">Form</MenuItem>
                  <MenuItem value="Plate">Plate</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Cover Type */}
            {editForm.productType === 'Cover' && (
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                  <InputLabel>Cover Type *</InputLabel>
                  <Select
                    value={editForm.coverType || ''}
                    onChange={(e) => handleFormChange('coverType', e.target.value)}
                    label="Cover Type *"
                  >
                    <MenuItem value="">Select Cover Type</MenuItem>
                    {coverTypes.map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {/* Plate Fields */}
            {editForm.productType === 'Plate' && (
              <>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                    <InputLabel>Bike Name</InputLabel>
                    <Select
                      value={editForm.bikeName || ''}
                      onChange={(e) => handleFormChange('bikeName', e.target.value)}
                      label="Bike Name"
                    >
                      <MenuItem value="">Select Bike</MenuItem>
                      {PLATE_BIKES.map(bike => (
                        <MenuItem key={bike} value={bike}>{bike}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {editForm.bikeName && editForm.bikeName !== 'Plastic Plate' && (
                  <>
                    {editForm.bikeName === '70' && (
                      <Grid item xs={12} sm={4}>
                        <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                          <InputLabel>Company *</InputLabel>
                          <Select
                            value={editForm.plateCompany || ''}
                            onChange={(e) => handleFormChange('plateCompany', e.target.value)}
                            label="Company *"
                          >
                            <MenuItem value="">Select Company</MenuItem>
                            {PLATE_COMPANIES.map(company => (
                              <MenuItem key={company} value={company}>{company}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    )}
                    <Grid item xs={12} sm={4}>
                      <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                        <InputLabel>Plate Type *</InputLabel>
                        <Select
                          value={editForm.plateType || ''}
                          onChange={(e) => handleFormChange('plateType', e.target.value)}
                          label="Plate Type *"
                          disabled={!editForm.bikeName || (editForm.bikeName === '70' && !editForm.plateCompany)}
                        >
                          <MenuItem value="">Select Plate Type</MenuItem>
                          {getPlateTypesForBikeAndCompany(editForm.bikeName, editForm.plateCompany).map(type => (
                            <MenuItem key={type} value={type}>{type}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}
              </>
            )}

            {/* Form Fields */}
            {editForm.productType === 'Form' && (
              <>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                    <InputLabel>Company *</InputLabel>
                    <Select
                      value={editForm.formCompany || ''}
                      onChange={(e) => handleFormChange('formCompany', e.target.value)}
                      label="Company *"
                    >
                      <MenuItem value="">Select Company</MenuItem>
                      {FORM_COMPANIES.map(company => (
                        <MenuItem key={company} value={company}>{company}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                {editForm.formCompany && (
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                      <InputLabel>Form Type *</InputLabel>
                      <Select
                        value={editForm.formType || ''}
                        onChange={(e) => handleFormChange('formType', e.target.value)}
                        label="Form Type *"
                      >
                        <MenuItem value="">Select Form Type</MenuItem>
                        {getFormTypesForCompany(editForm.formCompany).map(type => (
                          <MenuItem key={type} value={type}>{type}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                {editForm.formCompany && editForm.formType && (
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                      <InputLabel>Form Variant *</InputLabel>
                      <Select
                        value={editForm.formVariant || ''}
                        onChange={(e) => handleFormChange('formVariant', e.target.value)}
                        label="Form Variant *"
                      >
                        <MenuItem value="">Select Variant</MenuItem>
                        {getVariantsForCompanyAndType(editForm.formCompany, editForm.formType).map(variant => (
                          <MenuItem key={variant} value={variant}>{variant}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
                {editForm.formCompany && editForm.formType && editForm.formVariant && 
                 getBikesForVariant(editForm.formCompany, editForm.formType, editForm.formVariant).length < FORM_BIKES.length && (
                  <Grid item xs={12} sm={4}>
                    <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                      <InputLabel>Bike Name *</InputLabel>
                      <Select
                        value={editForm.bikeName || ''}
                        onChange={(e) => handleFormChange('bikeName', e.target.value)}
                        label="Bike Name *"
                      >
                        <MenuItem value="">Select Bike</MenuItem>
                        {getBikesForVariant(editForm.formCompany, editForm.formType, editForm.formVariant).map(bike => (
                          <MenuItem key={bike} value={bike}>{bike}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}
              </>
            )}

            <Divider sx={{ my: 2, width: '100%' }} />

            {/* Category and Company */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category"
                value={editForm.category || ''}
                onChange={(e) => handleFormChange('category', e.target.value)}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Subcategory"
                value={editForm.subcategory || ''}
                onChange={(e) => handleFormChange('subcategory', e.target.value)}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Company"
                value={editForm.company || ''}
                onChange={(e) => handleFormChange('company', e.target.value)}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>

            <Divider sx={{ my: 2, width: '100%' }} />

            {/* Pricing */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Price *"
                value={editForm.price || 0}
                onChange={(e) => handleFormChange('price', e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                size={isMobile ? 'small' : 'medium'}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Base Price"
                value={editForm.basePrice || 0}
                onChange={(e) => handleFormChange('basePrice', e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Cost Price"
                value={editForm.costPrice || 0}
                onChange={(e) => handleFormChange('costPrice', e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>

            <Divider sx={{ my: 2, width: '100%' }} />

            {/* Stock */}
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Quantity *"
                value={editForm.quantity || 0}
                onChange={(e) => handleFormChange('quantity', e.target.value)}
                inputProps={{ min: 0 }}
                size={isMobile ? 'small' : 'medium'}
                required
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Min Stock Level"
                value={editForm.minStockLevel || 10}
                onChange={(e) => handleFormChange('minStockLevel', e.target.value)}
                inputProps={{ min: 0 }}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="number"
                label="Max Stock Level"
                value={editForm.maxStockLevel || 1000}
                onChange={(e) => handleFormChange('maxStockLevel', e.target.value)}
                inputProps={{ min: 0 }}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={editForm.description || ''}
                onChange={(e) => handleFormChange('description', e.target.value)}
                multiline
                rows={3}
                size={isMobile ? 'small' : 'medium'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f5f5f5' }}>
          <Button 
            onClick={() => setOpenEditDialog(false)}
            variant="outlined"
            sx={{ borderRadius: 2 }}
            disabled={updating}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            startIcon={<Save />}
            onClick={handleUpdate}
            disabled={updating}
            sx={{ 
              borderRadius: 2,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              }
            }}
          >
            {updating ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
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
}
