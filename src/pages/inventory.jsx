import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert, Stack, TextField, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Button, InputAdornment,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Edit, Add, Search, Refresh, Clear, Inventory2, Warning,
  TrendingUp, Inventory as InventoryIcon, LocalOffer, Delete, ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import { axiosApi } from '../utils/api';
import { useNotification } from '../utils/notifications';
import HelpTooltip from '../components/HelpTooltip';
import GettingStarted from '../components/GettingStarted';
import { Checkbox } from '@mui/material';

export default function Inventory() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    sku: '',
    description: ''
  });
  const [stockAddAmount, setStockAddAmount] = useState('');
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedItems, setSelectedItems] = useState([]);
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
      const errorDetails = err.code === 'ECONNABORTED' 
        ? 'Request timeout - backend may be slow or unreachable'
        : err.message === 'Network Error'
        ? 'Network error - check if backend is running'
        : errorMsg;
      setError(`Failed to load inventory items: ${errorDetails}`);
      showNotification('error', `Failed to load inventory items: ${errorDetails}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort items
  let filteredItems = items.filter(item => {
    if (searchTerm && !item.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
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
    totalValue: filteredItems.reduce((sum, item) => sum + (item.price * item.quantity), 0),
    lowStock: filteredItems.filter(item => item.quantity <= 10).length,
    outOfStock: filteredItems.filter(item => item.quantity === 0).length
  };

  // Open edit dialog
  const handleEditClick = (item) => {
    setSelectedItem(item);
    setEditForm({
      name: item.name || '',
      category: item.category || '',
      price: item.price || 0,
      quantity: item.quantity || 0,
      sku: item.sku || '',
      description: item.description || ''
    });
    setStockAddAmount('');
    setOpenEditDialog(true);
  };

  // Handle form change
  const handleFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  // Update item
  const handleUpdateItem = async () => {
    try {
      setLoading(true);
      
      const updateData = {
        name: editForm.name,
        category: editForm.category,
        price: parseFloat(editForm.price),
        quantity: parseInt(editForm.quantity),
        description: editForm.description
      };

      await axiosApi.items.update(selectedItem._id, updateData);
      showNotification('success', 'Item updated successfully!');
      setOpenEditDialog(false);
      await fetchItems();
    } catch (error) {
      console.error('Update error:', error);
      showNotification('error', `Failed to update item: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Add stock
  const handleAddStock = async () => {
    if (!stockAddAmount || parseInt(stockAddAmount) <= 0) {
      showNotification('error', 'Please enter a valid quantity to add');
      return;
    }

    try {
      setLoading(true);
      const currentQuantity = parseInt(editForm.quantity);
      const addAmount = parseInt(stockAddAmount);
      const newQuantity = currentQuantity + addAmount;

      await axiosApi.items.update(selectedItem._id, {
        ...editForm,
        quantity: newQuantity
      });

      showNotification('success', `Added ${addAmount} units to stock!`);
      setStockAddAmount('');
      setEditForm(prev => ({ ...prev, quantity: newQuantity }));
      await fetchItems();
    } catch (error) {
      console.error('Add stock error:', error);
      showNotification('error', `Failed to add stock: ${error.response?.data?.error || error.message}`);
    } finally {
      setLoading(false);
    }
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
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
          }}>
            Inventory Management
          </Typography>
          <HelpTooltip 
            title="Inventory Management Help"
            content="Manage your inventory items, update stock levels, edit prices, and track inventory status. Use filters to find items quickly."
          />
        </Box>
        <Typography variant="subtitle1" color="textSecondary">
          Manage your inventory items, stock levels, and pricing
        </Typography>
      </Box>

      {/* Getting Started */}
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
        p: { xs: 2, sm: 3 }, 
        mb: 3,
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
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
          <Grid item xs={12} sm={6} md={3}>
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
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant={lowStockFilter ? 'contained' : 'outlined'}
              onClick={() => setLowStockFilter(!lowStockFilter)}
              startIcon={<Warning />}
              size="small"
            >
              Low Stock Only
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
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
          <Grid item xs={12} sm={6} md={1}>
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
          <Grid item xs={12} sm={6} md={1}>
            <Stack direction="row" spacing={1}>
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

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <Paper sx={{ 
          p: 2, 
          mb: 2, 
          bgcolor: 'primary.light', 
          color: 'white',
          borderRadius: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Typography variant="body1" fontWeight="medium">
            {selectedItems.length} item(s) selected
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              variant="contained"
              color="error"
              startIcon={<Delete />}
              onClick={async () => {
                if (window.confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) {
                  try {
                    setLoading(true);
                    await Promise.all(selectedItems.map(id => axiosApi.items.delete(id)));
                    showNotification('success', `${selectedItems.length} item(s) deleted successfully`);
                    setSelectedItems([]);
                    await fetchItems();
                  } catch (error) {
                    showNotification('error', 'Failed to delete items');
                  } finally {
                    setLoading(false);
                  }
                }
              }}
              sx={{ bgcolor: 'error.main', '&:hover': { bgcolor: 'error.dark' } }}
            >
              Delete Selected
            </Button>
            <Button
              variant="outlined"
              onClick={() => setSelectedItems([])}
              sx={{ borderColor: 'white', color: 'white' }}
            >
              Clear Selection
            </Button>
          </Stack>
        </Paper>
      )}

      {/* Items Table */}
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
                  fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.95rem' }
                }
              }}>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedItems.length > 0 && selectedItems.length < filteredItems.length}
                    checked={filteredItems.length > 0 && selectedItems.length === filteredItems.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems(filteredItems.map(item => item._id));
                      } else {
                        setSelectedItems([]);
                      }
                    }}
                    sx={{ color: 'white', '&.Mui-checked': { color: 'white' } }}
                  />
                </TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>SKU</TableCell>
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
                  selected={selectedItems.includes(item._id)}
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                      transition: 'all 0.2s ease-in-out'
                    },
                    transition: 'all 0.2s ease-in-out',
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(25, 118, 210, 0.08)'
                    }
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedItems.includes(item._id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems([...selectedItems, item._id]);
                        } else {
                          setSelectedItems(selectedItems.filter(id => id !== item._id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {item.name}
                    </Typography>
                    {item.sku && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: { xs: 'block', md: 'none' } }}>
                        SKU: {item.sku}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography variant="body2">{item.sku || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.category || 'General'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" color="success.main">
                      Rs {item.price?.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">
                      {item.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStockStatus(item.quantity)}
                      color={getStockColor(item.quantity)}
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
                        <Edit />
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

      {/* Edit Item Dialog */}
      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
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
          Edit Item - {selectedItem?.name}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Item Name"
                value={editForm.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={editForm.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                  label="Category"
                >
                  {categories.map(cat => (
                    <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="SKU"
                value={editForm.sku}
                onChange={(e) => handleFormChange('sku', e.target.value)}
                disabled
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Price (Rs)"
                type="number"
                value={editForm.price}
                onChange={(e) => handleFormChange('price', e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">Rs</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Current Stock"
                type="number"
                value={editForm.quantity}
                onChange={(e) => handleFormChange('quantity', e.target.value)}
                InputProps={{
                  readOnly: true,
                  endAdornment: <InputAdornment position="end">units</InputAdornment>
                }}
                sx={{ '& .MuiInputBase-input': { bgcolor: 'grey.100' } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ 
                p: 2, 
                bgcolor: 'info.light', 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'info.main'
              }}>
                <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                  Add Stock Quantity
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TextField
                    label="Add Quantity"
                    type="number"
                    value={stockAddAmount}
                    onChange={(e) => setStockAddAmount(e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                    InputProps={{
                      inputProps: { min: 1 }
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleAddStock}
                    disabled={!stockAddAmount || parseInt(stockAddAmount) <= 0}
                    startIcon={<Add />}
                  >
                    Add
                  </Button>
                </Stack>
                {stockAddAmount && parseInt(stockAddAmount) > 0 && (
                  <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                    New stock will be: {parseInt(editForm.quantity) + parseInt(stockAddAmount)} units
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                value={editForm.description}
                onChange={(e) => handleFormChange('description', e.target.value)}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
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
            onClick={handleUpdateItem}
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
}
