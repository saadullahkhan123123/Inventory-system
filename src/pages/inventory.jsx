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

  // Handle edit click - Only load quantity and price for editing
  const handleEditClick = (item) => {
    setSelectedItem(item);
    setEditForm({
      quantity: item.quantity || 0,
      price: item.price || 0
    });
    setOpenEditDialog(true);
  };

  // Handle form change - Simple update for quantity and price only
  const handleFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle update - Only update quantity and price, preserve all other fields
  const handleUpdate = async () => {
    try {
      setUpdating(true);

      // Validation
      const quantity = parseInt(editForm.quantity) || 0;
      const price = parseFloat(editForm.price) || 0;

      if (price < 0) {
        showNotification('error', 'Price cannot be negative');
        return;
      }
      if (quantity < 0) {
        showNotification('error', 'Quantity cannot be negative');
        return;
      }

      // Update only quantity and price, preserve all other fields from selectedItem
      const updateData = {
        name: selectedItem.name || '',
        sku: selectedItem.sku || '',
        productType: selectedItem.productType || 'Cover',
        coverType: selectedItem.coverType || '',
        plateCompany: selectedItem.plateCompany || '',
        bikeName: selectedItem.bikeName || '',
        plateType: selectedItem.plateType || '',
        formCompany: selectedItem.formCompany || '',
        formType: selectedItem.formType || '',
        formVariant: selectedItem.formVariant || '',
        category: selectedItem.category || 'General',
        subcategory: selectedItem.subcategory || '',
        company: selectedItem.company || '',
        quantity: quantity,
        price: price,
        basePrice: selectedItem.basePrice || price,
        description: selectedItem.description || '',
        minStockLevel: selectedItem.minStockLevel || 10,
        maxStockLevel: selectedItem.maxStockLevel || 1000,
        costPrice: selectedItem.costPrice || 0
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
          {/* Item Name Display (Read-only) */}
          <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="body2" color="textSecondary" gutterBottom>
              Item Name
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {selectedItem?.name || 'Unnamed Item'}
            </Typography>
            {selectedItem?.sku && (
              <>
                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                  SKU: {selectedItem.sku}
                </Typography>
              </>
            )}
          </Box>

          <Grid container spacing={3}>
            {/* Quantity */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Quantity *"
                value={editForm.quantity || 0}
                onChange={(e) => handleFormChange('quantity', e.target.value)}
                inputProps={{ min: 0 }}
                size={isMobile ? 'small' : 'medium'}
                required
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '1rem', sm: '1.125rem' }
                  }
                }}
              />
            </Grid>

            {/* Price */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Price *"
                value={editForm.price || 0}
                onChange={(e) => handleFormChange('price', e.target.value)}
                inputProps={{ min: 0, step: 0.01 }}
                size={isMobile ? 'small' : 'medium'}
                required
                sx={{
                  '& .MuiInputBase-root': {
                    fontSize: { xs: '1rem', sm: '1.125rem' }
                  }
                }}
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
