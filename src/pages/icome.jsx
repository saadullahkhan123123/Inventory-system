import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  Card,
  CardContent,
  Chip,
  Paper,
} from "@mui/material";
import { useNotification } from "../utils/notifications";
import { axiosApi } from "../utils/api";

const Income = () => {
  const [loading, setLoading] = useState({ 
    products: true, 
    income: true, 
    submitting: false,
    testing: false 
  });
  const [incomes, setIncomes] = useState([]);
  const [incomeSummary, setIncomeSummary] = useState(null);
  const { notification, showNotification, hideNotification } = useNotification();

  // Fetch income data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch income records
        const incomeRes = await axiosApi.income.getAll({ limit: 50 });
        const incomeData = incomeRes.data?.records || incomeRes.data || [];
        setIncomes(Array.isArray(incomeData) ? incomeData : []);

        // Fetch income summary
        const summaryRes = await axiosApi.income.getSummary();
        setIncomeSummary(summaryRes.data);

      } catch (err) {
        console.error('Error fetching data:', err);
        const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch data';
        const errorDetails = err.code === 'ECONNABORTED' 
          ? 'Request timeout - backend may be slow or unreachable'
          : err.message === 'Network Error'
          ? 'Network error - check if backend is running'
          : errorMsg;
        showNotification("error", `Failed to fetch data: ${errorDetails}`);
      } finally {
        setLoading({ income: false });
      }
    };

    fetchData();
  }, []);

  if (loading.income) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ mt: 2 }}>Loading income data...</Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3, md: 4 }, 
      maxWidth: 1400, 
      margin: '0 auto',
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%)'
    }}>
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h4" component="h1" sx={{ 
          mb: 1, 
          fontWeight: 'bold',
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
        }}>
          Income Management
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" sx={{
          fontSize: { xs: '0.875rem', sm: '1rem' },
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
        }}>
          Track and analyze your sales income from slips
        </Typography>
      </Box>

      {/* Income Summary */}
      {incomeSummary && (
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>Total Income</Typography>
                <Typography variant="h4" fontWeight="bold">
                  Rs {incomeSummary.totalIncome?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(245, 87, 108, 0.3)',
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>Today's Income</Typography>
                <Typography variant="h4" fontWeight="bold">
                  Rs {incomeSummary.todayIncome?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(79, 172, 254, 0.3)',
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>Monthly Income</Typography>
                <Typography variant="h4" fontWeight="bold">
                  Rs {incomeSummary.monthIncome?.toLocaleString() || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ 
              background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
              color: 'white',
              borderRadius: 3,
              boxShadow: '0 4px 15px rgba(250, 112, 154, 0.3)',
              height: '100%'
            }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 1, opacity: 0.9 }}>Total Records</Typography>
                <Typography variant="h4" fontWeight="bold">
                  {incomeSummary.totalRecords || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}



      {/* Recent Income Entries */}
      {incomes.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ 
            fontWeight: 'bold',
            mb: 3,
            background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Recent Income Entries
          </Typography>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {incomes.slice(0, 6).map((income, index) => (
              <Grid item xs={12} sm={6} md={4} key={income._id || index}>
                <Card variant="outlined" sx={{ 
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    borderColor: 'primary.main',
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out'
                  },
                  transition: 'all 0.2s ease-in-out',
                  height: '100%'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                      <Typography variant="subtitle2" color="textSecondary">
                        {new Date(income.date || income.createdAt).toLocaleDateString()}
                      </Typography>
                      <Chip 
                        label={income.paymentMethod || 'Cash'} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                    <Typography variant="h5" sx={{ 
                      color: 'success.main',
                      fontWeight: 'bold',
                      mb: 1
                    }}>
                      Rs {income.totalIncome?.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                      {income.productsSold?.[0]?.productName || 'No products'}
                      {income.productsSold?.length > 1 && ` +${income.productsSold.length - 1} more`}
                    </Typography>
                    <Typography variant="caption" display="block" color="textSecondary">
                      {income.customerName || 'Walk-in Customer'}
                    </Typography>
                    {income.slipNumber && (
                      <Typography variant="caption" display="block" color="primary" sx={{ mt: 0.5 }}>
                        Slip: {income.slipNumber}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={hideNotification}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={hideNotification}
          severity={notification.severity}
          variant="filled"
          sx={{ width: "100%" }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Income;