import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import { axiosApi } from '../utils/api';

export default function ResetDatabase() {
  const [secret, setSecret] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleReset = async () => {
    if (!secret.trim()) {
      setError('Please enter the reset secret.');
      return;
    }
    if (confirmText.trim().toUpperCase() !== 'RESET_ALL') {
      setError('Please type RESET_ALL in the confirmation box.');
      return;
    }
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await axiosApi.resetDatabase(secret.trim());
      setResult(res.data);
      setSecret('');
      setConfirmText('');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 560,
        mx: 'auto',
        mt: { xs: 2, sm: 4 },
        p: { xs: 1.5, sm: 2 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: 2,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}
      >
        <Typography variant="h5" fontWeight="bold" gutterBottom color="error">
          Reset Database
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Clear all slips, income, and inventory items. This cannot be undone.
        </Typography>

        <Alert severity="warning" sx={{ mb: 2 }}>
          This will permanently delete:
          <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
            <li>All slips</li>
            <li>All income records</li>
            <li>All inventory items</li>
          </ul>
        </Alert>

        <TextField
          fullWidth
          label="Reset Secret"
          type="password"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          placeholder="Enter RESET_SECRET from .env"
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Type RESET_ALL to confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="RESET_ALL"
          sx={{ mb: 2 }}
        />

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {result && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {result.message}
            {result.deleted && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Deleted: Slips {result.deleted.slips}, Income {result.deleted.income}, Items {result.deleted.items}
              </Typography>
            )}
          </Alert>
        )}

        <Button
          fullWidth
          variant="contained"
          color="error"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <DeleteForeverIcon />}
          onClick={handleReset}
          disabled={loading}
        >
          {loading ? 'Resetting...' : 'Reset Database'}
        </Button>

        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">
          Default secret (if RESET_SECRET is not set in backend): reset123
        </Typography>
      </Paper>
    </Box>
  );
}
