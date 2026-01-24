import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert, Stack, TextField, IconButton, Tooltip,
  FormControl, InputLabel, Select, MenuItem, Button
} from '@mui/material';
import {
  Search, Refresh, Clear, Inventory2,
  TrendingUp, Inventory as InventoryIcon, ArrowUpward, ArrowDownward
} from '@mui/icons-material';
import { axiosApi } from '../utils/api';
import { useNotification } from '../utils/notifications';

export default function SearchProducts() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
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
        <Typography sx={{ ml: 2 }}>Loading products...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: 1400, 
      mx: 'auto', 
      mt: { xs: 0.5, sm: 1, md: 2 }, 
      p: { xs: 1, sm: 1.5, md: 2, lg: 3 },
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%)',
      width: '100%',
      boxSizing: 'border-box'
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
            Search Products
          </Typography>
        </Box>
        <Typography variant="subtitle1" color="textSecondary">
          Search and view product information. This is a read-only view.
        </Typography>
      </Box>

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
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="center">
          <Grid item xs={12} sm={12} md={4}>
            <TextField
              fullWidth
              label="Search Products"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchItems()}
              InputProps={{
                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1, fontSize: { xs: '18px', sm: '20px' } }} />
              }}
              size="small"
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }
              }}
            />
          </Grid>
          <Grid item xs={6} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                <MenuItem value="" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>All Categories</MenuItem>
                {categories.map(cat => (
                  <MenuItem key={cat} value={cat} sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>{cat}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <Button
              fullWidth
              variant={lowStockFilter ? 'contained' : 'outlined'}
              onClick={() => setLowStockFilter(!lowStockFilter)}
              size="small"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                py: { xs: 0.75, sm: 1 }
              }}
            >
              Low Stock
            </Button>
          </Grid>
          <Grid item xs={6} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Sort By</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort By"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                <MenuItem value="name" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Name</MenuItem>
                <MenuItem value="price" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Price</MenuItem>
                <MenuItem value="quantity" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Stock</MenuItem>
                <MenuItem value="category" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Category</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={6} sm={6} md={1}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              size="small"
              startIcon={sortOrder === 'asc' ? <ArrowUpward sx={{ fontSize: { xs: '16px', sm: '18px' } }} /> : <ArrowDownward sx={{ fontSize: { xs: '16px', sm: '18px' } }} />}
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {sortOrder === 'asc' ? 'ASC' : 'DESC'}
            </Button>
          </Grid>
          <Grid item xs={12} sm={12} md={1}>
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'center', md: 'flex-start' }}>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchItems} size="small" sx={{ fontSize: { xs: '18px', sm: '20px' } }}>
                  <Refresh />
                </IconButton>
              </Tooltip>
              {searchTerm && (
                <IconButton onClick={() => setSearchTerm('')} size="small" sx={{ fontSize: { xs: '18px', sm: '20px' } }}>
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
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, px: { xs: 0.5, sm: 1 } }}>Item Name</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, fontSize: { xs: '0.7rem', sm: '0.875rem' }, px: { xs: 0.5, sm: 1 } }}>SKU</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, px: { xs: 0.5, sm: 1 } }}>Category</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, px: { xs: 0.5, sm: 1 } }}>Price</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, px: { xs: 0.5, sm: 1 } }}>Stock</TableCell>
                <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, px: { xs: 0.5, sm: 1 } }}>Status</TableCell>
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
                  <TableCell sx={{ px: { xs: 0.5, sm: 1 }, py: { xs: 0.75, sm: 1 } }}>
                    <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {item.name}
                    </Typography>
                    {item.sku && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: { xs: 'block', md: 'none' }, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                        SKU: {item.sku}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, px: { xs: 0.5, sm: 1 }, py: { xs: 0.75, sm: 1 } }}>
                    <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{item.sku || 'N/A'}</Typography>
                  </TableCell>
                  <TableCell sx={{ px: { xs: 0.5, sm: 1 }, py: { xs: 0.75, sm: 1 } }}>
                    <Chip label={item.category || 'General'} size="small" variant="outlined" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }} />
                  </TableCell>
                  <TableCell sx={{ px: { xs: 0.5, sm: 1 }, py: { xs: 0.75, sm: 1 } }}>
                    <Typography variant="body2" fontWeight="bold" color="success.main" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Rs {item.price?.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ px: { xs: 0.5, sm: 1 }, py: { xs: 0.75, sm: 1 } }}>
                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {item.quantity}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ px: { xs: 0.5, sm: 1 }, py: { xs: 0.75, sm: 1 } }}>
                    <Chip
                      label={getStockStatus(item.quantity)}
                      color={getStockColor(item.quantity)}
                      size="small"
                      sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                    />
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
              {searchTerm ? 'Try a different search term' : 'No products available'}
            </Typography>
          </Box>
        )}
      </Paper>

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

