import React, { useState, useEffect } from 'react';
import { Box, Alert, CircularProgress, Button, Typography } from '@mui/material';
import { Refresh } from '@mui/icons-material';
import { axiosApi } from '../utils/api';

const BackendStatus = () => {
  const [status, setStatus] = useState('checking'); // checking, online, offline
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkBackend = async () => {
    setLoading(true);
    setStatus('checking');
    setError(null);
    
    try {
      const response = await axiosApi.testConnection();
      console.log('✅ Backend is online:', response.data);
      setStatus('online');
      setError(null);
    } catch (err) {
      console.error('❌ Backend connection failed:', err);
      setStatus('offline');
      setError({
        message: err.message,
        code: err.code,
        status: err.response?.status,
        url: err.config?.baseURL + err.config?.url,
        details: err.response?.data || 'Backend server is not responding'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkBackend();
  }, []);

  if (status === 'online') {
    return null; // Don't show anything if backend is online
  }

  return (
    <Box sx={{ p: 2, mb: 2 }}>
      <Alert 
        severity={status === 'offline' ? 'error' : 'info'}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={checkBackend}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={16} /> : <Refresh />}
          >
            Retry
          </Button>
        }
      >
        <Typography variant="body2" fontWeight="bold">
          {status === 'checking' && 'Checking backend connection...'}
          {status === 'offline' && 'Backend server is offline or unreachable'}
        </Typography>
        {error && (
          <Box sx={{ mt: 1 }}>
            <Typography variant="caption" display="block">
              <strong>Error:</strong> {error.message}
            </Typography>
            {error.url && (
              <Typography variant="caption" display="block">
                <strong>URL:</strong> {error.url}
              </Typography>
            )}
            {error.status && (
              <Typography variant="caption" display="block">
                <strong>Status:</strong> {error.status}
              </Typography>
            )}
            {error.details && typeof error.details === 'string' && (
              <Typography variant="caption" display="block">
                <strong>Details:</strong> {error.details}
              </Typography>
            )}
          </Box>
        )}
      </Alert>
    </Box>
  );
};

export default BackendStatus;


