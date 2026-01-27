import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Grid, Card, CardContent,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, CircularProgress, Alert, Stack, IconButton, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, useMediaQuery, useTheme
} from '@mui/material';
import {
  Search, Refresh, Delete, Clear
} from '@mui/icons-material';
import { axiosApi } from '../utils/api';
import { useNotification } from '../utils/notifications';

const SearchSlip = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { notification, showNotification, hideNotification } = useNotification();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [allSlips, setAllSlips] = useState([]);
  const [filteredSlips, setFilteredSlips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlip, setSelectedSlip] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  // Fetch all slips on component mount
  useEffect(() => {
    fetchAllSlips();
  }, []);

  // Filter slips by customer name only
  useEffect(() => {
    let filtered = [...allSlips];

    // Search filter - only by customer name
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(slip => {
        const customerName = (slip.customerName || '').toLowerCase();
        return customerName.includes(term);
      });
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => {
      const aDate = new Date(a.date || a.createdAt);
      const bDate = new Date(b.date || b.createdAt);
      return bDate - aDate;
    });

    setFilteredSlips(filtered);
  }, [searchTerm, allSlips]);

  // Fetch all slips
  const fetchAllSlips = async () => {
    setLoading(true);
    try {
      const response = await axiosApi.slips.getAll({ limit: 1000 });
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

  // Delete slip
  const handleDeleteSlip = async () => {
    try {
      setLoading(true);
      await axiosApi.slips.delete(selectedSlip._id);
      showNotification('success', 'Slip deleted successfully! Products restored to inventory and income updated.');
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
              Search Slips
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" sx={{
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}>
              Search slips by customer name and manage them
            </Typography>
          </Box>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchAllSlips} disabled={loading}>
              <Refresh />
            </IconButton>
          </Tooltip>
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

      {/* Search - Only by Name */}
      <Paper sx={{ 
        p: { xs: 2, sm: 3 }, 
        mb: { xs: 2, sm: 3 },
        borderRadius: 3,
        background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
      }} elevation={0}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={8} md={10}>
            <TextField
              fullWidth
              label="Search by Customer Name"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />
              }}
              size={isMobile ? 'small' : 'medium'}
              placeholder="Enter customer name to search..."
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
            <Stack direction="row" spacing={1}>
              {searchTerm && (
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={() => setSearchTerm('')}
                  size={isMobile ? 'small' : 'medium'}
                  fullWidth
                >
                  Clear
                </Button>
              )}
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {/* Results Table */}
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
                <TableCell>Customer Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Products</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : filteredSlips.map((slip) => (
                <TableRow 
                  key={slip._id} 
                  hover
                  sx={{
                    '&:hover': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                      transition: 'all 0.2s ease-in-out'
                    },
                    transition: 'all 0.2s ease-in-out'
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {slip.slipNumber || slip._id?.slice(-8)}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {slip.customerName || 'Walk Customer'}
                    </Typography>
                    {slip.customerPhone && (
                      <Typography variant="caption" color="textSecondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                        {slip.customerPhone}
                      </Typography>
                    )}
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
                    <Tooltip title="Delete Slip">
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
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {!loading && filteredSlips.length === 0 && (
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
              {searchTerm 
                ? 'No slips found for this customer name. Try a different name.' 
                : 'No slips available. Create your first slip to get started!'}
            </Typography>
          </Box>
        )}
      </Paper>

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
