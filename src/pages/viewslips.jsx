import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, 
  Paper, 
  Typography, 
  Button, 
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Stack,
  Alert,
  CircularProgress,
  useMediaQuery,
  useTheme,
  Chip
} from '@mui/material';
import { ArrowBack, Download, Print } from '@mui/icons-material';
import { pdf, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { axiosApi } from '../utils/api'; // ✅ Import your axiosApi

// PDF Styles
const styles = StyleSheet.create({
  page: { 
    padding: 30, 
    fontSize: 12,
    fontFamily: 'Helvetica'
  },
  header: { 
    textAlign: 'center', 
    marginBottom: 20,
    borderBottom: '1pt solid #000',
    paddingBottom: 10
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5
  },
  slipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  customerInfo: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f5f5f5'
  },
  table: { 
    display: "table", 
    width: "auto", 
    borderStyle: "solid", 
    borderWidth: 1, 
    marginBottom: 20 
  },
  tableRow: { 
    flexDirection: "row" 
  },
  tableColHeader: { 
    width: "25%", 
    borderStyle: "solid", 
    borderWidth: 1, 
    backgroundColor: "#eee", 
    padding: 8,
    fontWeight: 'bold'
  },
  tableCol: { 
    width: "25%", 
    borderStyle: "solid", 
    borderWidth: 1, 
    padding: 8 
  },
  totals: { 
    marginTop: 10, 
    textAlign: "right",
    borderTop: '1pt solid #000',
    paddingTop: 10
  },
  totalAmount: {
    fontSize: 14, 
    fontWeight: 'bold'
  },
  footer: {
    marginTop: 30, 
    textAlign: "center",
    borderTop: '1pt solid #000',
    paddingTop: 10
  } 
});

// PDF Document Component
const SlipPDFDocument = ({ slip }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.companyName}>Saeed Auto</Text>
        <Text>Contact: +92 300 1234567</Text>
        <Text style={styles.slipTitle}>SALES SLIP</Text>
      </View>

      {/* Customer Info */}
      <View style={styles.customerInfo}>
        <Text>Slip #: {slip.slipNumber || slip._id}</Text>
        <Text>Date: {new Date(slip.date || slip.createdAt).toLocaleString()}</Text>
        <Text>Customer: {slip.customerName || 'Walk Customer'}</Text>
        {slip.customerPhone && <Text>Phone: {slip.customerPhone}</Text>}
        {(slip.paymentMethod === 'Cash' || slip.paymentMethod === 'Account') && (
          <Text>Payment Method: {slip.paymentMethod}</Text>
        )}
      </View>

      {/* Products Table */}
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <Text style={styles.tableColHeader}>Product</Text>
          <Text style={styles.tableColHeader}>Qty</Text>
          <Text style={styles.tableColHeader}>Unit Price</Text>
          <Text style={styles.tableColHeader}>Total Price</Text>
        </View>
        {slip.products.map((p, i) => (
          <View style={styles.tableRow} key={i}>
            <Text style={styles.tableCol}>{p.productName}</Text>
            <Text style={styles.tableCol}>{p.quantity}</Text>
            <Text style={styles.tableCol}>Rs {p.unitPrice?.toLocaleString()}</Text>
            <Text style={styles.tableCol}>Rs {p.totalPrice?.toLocaleString()}</Text>
          </View>
        ))}
      </View>

      {/* Totals */}
      <View style={styles.totals}>
        <Text>Subtotal: Rs {slip.subtotal?.toLocaleString()}</Text>
        {slip.discount > 0 && (
          <Text>Discount: -Rs {slip.discount?.toLocaleString()}</Text>
        )}
        <Text style={styles.totalAmount}>Payable Amount: Rs {slip.totalAmount?.toLocaleString()}</Text>
        {slip.paymentMethod === 'Udhar' && (
          <>
            {slip.previousBalance > 0 && (
              <Text>Previous Balance: Rs {slip.previousBalance?.toLocaleString()}</Text>
            )}
            {slip.partialPayment > 0 && (
              <Text style={{ color: '#4caf50' }}>
                Customer Paid: Rs {slip.partialPayment?.toLocaleString()}
              </Text>
            )}
            <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#ff9800' }}>
              Remaining Balance: Rs {((slip.currentBalance || slip.totalAmount || 0) - (slip.partialPayment || 0)).toLocaleString()}
            </Text>
          </>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Thank you for your purchase!</Text>
        <Text>Muhammad saad ullah khan 03146074093</Text>
      </View>
    </Page>
  </Document>
);

function SlipPage() {
  const { slipId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [slip, setSlip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch actual slip details using axiosApi
    const fetchSlip = async () => {
      try {
        setLoading(true);
        setError('');
        
        // ✅ FIXED: Use axiosApi instead of direct fetch
        const response = await axiosApi.slips.getById(slipId);
        
        setSlip(response.data);
        
      } catch (error) {
        console.error('Error fetching slip:', error);
        console.error('Error details:', error.response?.data);
        
        // Use enhanced error message if available
        let errorMsg = error.userMessage || error.response?.data?.error || error.message || 'Failed to load slip data';
        
        // Special handling for 503 errors
        if (error.response?.status === 503) {
          if (error.response?.data?.error === 'Database connection unavailable') {
            errorMsg = 'Database is temporarily unavailable. The system is retrying automatically. Please wait a moment and refresh.';
          } else {
            errorMsg = 'Service is temporarily unavailable. Please wait a moment and try again.';
          }
        } else if (error.code === 'ECONNABORTED') {
          errorMsg = 'Request timeout - backend may be slow or unreachable. Please try again.';
        } else if (error.message === 'Network Error') {
          errorMsg = 'Network error - please check your internet connection.';
        }
        
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (slipId) {
      fetchSlip();
    }
  }, [slipId]);

  // Download PDF function
  const downloadPDF = async () => {
    if (!slip) return;
    
    setGeneratingPDF(true);
    try {
      const blob = await pdf(<SlipPDFDocument slip={slip} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `slip-${slip.slipNumber || slip._id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Print function
  const handlePrint = () => {
    if (!slip) return;

    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Slip ${slip.slipNumber || slip._id}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              color: #000;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px;
              border-bottom: 2px solid #000;
              padding-bottom: 10px;
            }
            .company-name { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 5px;
            }
            .slip-title {
              font-size: 20px;
              font-weight: bold;
              margin: 10px 0;
            }
            .customer-info {
              margin-bottom: 20px;
              padding: 10px;
              background-color: #f5f5f5;
              border-radius: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #eee;
              font-weight: bold;
            }
            .totals {
              text-align: right;
              margin-top: 20px;
              border-top: 2px solid #000;
              padding-top: 10px;
            }
            .total-amount {
              font-size: 18px;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              border-top: 1px solid #000;
              padding-top: 10px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company-name">Saeed Auto</div>
            <div>Contact: +92 300 1234567</div>
            <div class="slip-title">SALES SLIP</div>
          </div>
          
          <div class="customer-info">
            <div><strong>Slip #:</strong> ${slip.slipNumber || slip._id}</div>
            <div><strong>Date:</strong> ${new Date(slip.date || slip.createdAt).toLocaleString()}</div>
            <div><strong>Customer:</strong> ${slip.customerName || 'Walk Customer'}</div>
            ${slip.customerPhone ? `<div><strong>Phone:</strong> ${slip.customerPhone}</div>` : ''}
            ${(slip.paymentMethod === 'Cash' || slip.paymentMethod === 'Account') ? `<div><strong>Payment Method:</strong> ${slip.paymentMethod}</div>` : ''}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total Price</th>
              </tr>
            </thead>
            <tbody>
              ${slip.products.map(product => {
                let productDisplay = product.productName;
                if (product.productType === 'Plate') {
                  const plateDetails = [];
                  if (product.bikeName) plateDetails.push(`Bike: ${product.bikeName}`);
                  if (product.plateCompany) plateDetails.push(`Company: ${product.plateCompany}`);
                  if (product.plateType) plateDetails.push(`Type: ${product.plateType}`);
                  if (plateDetails.length > 0) {
                    productDisplay += ` (${plateDetails.join(', ')})`;
                  }
                } else if (product.productType === 'Cover' && product.coverType) {
                  productDisplay += ` (${product.coverType})`;
                } else if (product.productType === 'Form') {
                  const formDetails = [];
                  if (product.formCompany) formDetails.push(product.formCompany);
                  if (product.formType) formDetails.push(product.formType);
                  if (product.formVariant) formDetails.push(product.formVariant);
                  if (product.bikeName) formDetails.push(`Bike: ${product.bikeName}`);
                  if (formDetails.length > 0) {
                    productDisplay += ` (${formDetails.join(', ')})`;
                  }
                }
                return `
                <tr>
                  <td>${productDisplay}</td>
                  <td>${product.quantity}</td>
                  <td>Rs ${product.unitPrice?.toLocaleString()}</td>
                  <td>Rs ${product.totalPrice?.toLocaleString()}</td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
          
          <div class="totals">
            <div><strong>Subtotal:</strong> Rs ${slip.subtotal?.toLocaleString()}</div>
            ${slip.discount > 0 ? `<div><strong>Discount:</strong> -Rs ${slip.discount?.toLocaleString()}</div>` : ''}
            <div class="total-amount"><strong>Payable Amount:</strong> Rs ${slip.totalAmount?.toLocaleString()}</div>
            ${slip.paymentMethod === 'Udhar' ? `
              ${slip.previousBalance > 0 ? `<div><strong>Previous Balance:</strong> Rs ${slip.previousBalance?.toLocaleString()}</div>` : ''}
              ${slip.partialPayment > 0 ? `<div style="color: #4caf50;"><strong>Customer Paid:</strong> Rs ${slip.partialPayment?.toLocaleString()}</div>` : ''}
              <div style="font-size: 18px; font-weight: bold; color: #ff9800;"><strong>Remaining Balance:</strong> Rs ${((slip.currentBalance || slip.totalAmount || 0) - (slip.partialPayment || 0)).toLocaleString()}</div>
            ` : ''}
          </div>
          
          <div class="footer">
            <div>Software Developed by SAAD  </div>
            <div><strong> Contact: WhatsApp 03146074093</strong></div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 100);
            }
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading slip data...</Typography>
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/slips')}>
          Back to Slips
        </Button>
      </Container>
    );
  }

  if (!slip) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="warning">Slip not found</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/slips')} sx={{ mt: 2 }}>
          Back to Slips
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ 
      mt: { xs: 1, sm: 2, md: 4 }, 
      mb: { xs: 2, sm: 3, md: 4 },
      minHeight: '100vh',
      px: { xs: 1, sm: 2 }
    }}>
      <Stack 
        direction={{ xs: 'column', sm: 'row' }} 
        justifyContent="space-between" 
        alignItems={{ xs: 'stretch', sm: 'center' }} 
        spacing={{ xs: 1, sm: 2 }}
        sx={{ mb: { xs: 2, sm: 3 } }}
        className="no-print"
      >
        <Button 
          startIcon={<ArrowBack />} 
          onClick={() => navigate('/slips')}
          variant="outlined"
          sx={{ 
            borderRadius: 2,
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
          }}
        >
          Back to Slips
        </Button>
        
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button 
            variant="outlined" 
            startIcon={<Print />}
            onClick={handlePrint}
            sx={{ 
              borderRadius: 2,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            Print
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Download />}
            onClick={downloadPDF}
            disabled={generatingPDF}
            sx={{
              borderRadius: 2,
              background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
              },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            {generatingPDF ? 'Generating...' : 'Download PDF'}
          </Button>
        </Stack>
      </Stack>
      
      <Paper elevation={0} sx={{ 
        p: { xs: 2, sm: 3, md: 4 },
        borderRadius: { xs: 2, sm: 3 },
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        '@media print': {
          boxShadow: 'none',
          borderRadius: 0,
          p: 2
        }
      }} id="slip-content">
        <Typography variant="h4" gutterBottom align="center" sx={{
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
          mb: { xs: 2, sm: 3 },
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          '@media print': {
            color: '#000',
            WebkitTextFillColor: '#000',
            background: 'none'
          }
        }}>
          Slip Details
        </Typography>
        
        <Box sx={{ 
          mb: { xs: 2, sm: 3 },
          fontSize: { xs: '0.875rem', sm: '1rem' },
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
        }}>
          <Typography sx={{ fontSize: 'inherit', fontFamily: 'inherit' }}>
            <strong>Slip #:</strong> {slip.slipNumber || slip._id}
          </Typography>
          <Typography sx={{ fontSize: 'inherit', fontFamily: 'inherit' }}>
            <strong>Date:</strong> {new Date(slip.date || slip.createdAt).toLocaleString()}
          </Typography>
          <Typography sx={{ fontSize: 'inherit', fontFamily: 'inherit' }}>
            <strong>Customer:</strong> {slip.customerName || 'Walk Customer'}
          </Typography>
          {slip.customerPhone && (
            <Typography sx={{ fontSize: 'inherit', fontFamily: 'inherit' }}>
              <strong>Phone:</strong> {slip.customerPhone}
            </Typography>
          )}
          {(slip.paymentMethod === 'Cash' || slip.paymentMethod === 'Account') && (
            <Typography sx={{ fontSize: 'inherit', fontFamily: 'inherit' }}>
              <strong>Payment Method:</strong> {slip.paymentMethod}
            </Typography>
          )}
          {slip.status && (
            <Typography sx={{ fontSize: 'inherit', fontFamily: 'inherit' }}>
              <strong>Status:</strong> {slip.status}
            </Typography>
          )}
        </Box>

        <TableContainer component={Paper} sx={{ 
          borderRadius: { xs: 1, sm: 2 }, 
          overflow: 'hidden',
          '@media print': {
            borderRadius: 0,
            boxShadow: 'none'
          }
        }}>
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow sx={{ 
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                '& .MuiTableCell-head': {
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                  '@media print': {
                    background: '#f5f5f5 !important',
                    color: '#000 !important'
                  }
                }
              }}>
                <TableCell><strong>Product</strong></TableCell>
                <TableCell><strong>Qty</strong></TableCell>
                <TableCell><strong>Unit Price</strong></TableCell>
                <TableCell><strong>Total Price</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {slip.products.map((product, index) => (
                <TableRow key={index}>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                  }}>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {product.productName}
                      </Typography>
                      {product.productType === 'Plate' && (
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                          {product.bikeName && (
                            <Chip 
                              label={`Bike: ${product.bikeName}`} 
                              size="small" 
                              variant="outlined" 
                              color="secondary"
                              sx={{ fontSize: '0.65rem', height: '18px' }} 
                            />
                          )}
                          {product.plateCompany && (
                            <Chip 
                              label={`Company: ${product.plateCompany}`} 
                              size="small" 
                              variant="outlined" 
                              color="secondary"
                              sx={{ fontSize: '0.65rem', height: '18px' }} 
                            />
                          )}
                          {product.plateType && (
                            <Chip 
                              label={`Type: ${product.plateType}`} 
                              size="small" 
                              variant="outlined" 
                              color="secondary"
                              sx={{ fontSize: '0.65rem', height: '18px' }} 
                            />
                          )}
                        </Box>
                      )}
                      {product.productType === 'Cover' && product.coverType && (
                        <Chip 
                          label={product.coverType} 
                          size="small" 
                          variant="outlined" 
                          color="primary"
                          sx={{ fontSize: '0.65rem', height: '18px', mt: 0.5 }} 
                        />
                      )}
                      {product.productType === 'Form' && (
                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                          {product.formCompany && (
                            <Chip 
                              label={`${product.formCompany} ${product.formType || ''}`} 
                              size="small" 
                              variant="outlined" 
                              color="info"
                              sx={{ fontSize: '0.65rem', height: '18px' }} 
                            />
                          )}
                          {product.formVariant && (
                            <Chip 
                              label={product.formVariant} 
                              size="small" 
                              variant="outlined" 
                              color="info"
                              sx={{ fontSize: '0.65rem', height: '18px' }} 
                            />
                          )}
                          {product.bikeName && (
                            <Chip 
                              label={`Bike: ${product.bikeName}`} 
                              size="small" 
                              variant="outlined" 
                              color="info"
                              sx={{ fontSize: '0.65rem', height: '18px' }} 
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                  }}>
                    {product.quantity}
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                  }}>
                    Rs {product.unitPrice?.toLocaleString()}
                  </TableCell>
                  <TableCell sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                  }}>
                    Rs {product.totalPrice?.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box sx={{ 
          mt: { xs: 2, sm: 3 }, 
          p: { xs: 2, sm: 3 },
          textAlign: 'right',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #ffffff 100%)',
          borderRadius: { xs: 1, sm: 2 },
          border: '1px solid #e0e0e0',
          '@media print': {
            background: '#f9f9f9',
            border: '1px solid #000'
          }
        }}>
          <Typography sx={{ 
            mb: 1,
            fontSize: { xs: '0.875rem', sm: '1rem' },
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
          }}>
            <strong>Subtotal:</strong> Rs {slip.subtotal?.toLocaleString()}
          </Typography>
          {slip.discount > 0 && (
            <Typography sx={{ 
              mb: 1,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
            }}>
              <strong>Discount:</strong> -Rs {(slip.discount || 0).toLocaleString()}
            </Typography>
          )}
          {slip.paymentMethod === 'Udhar' && (
            <>
              {slip.previousBalance > 0 && (
                <Typography sx={{ 
                  mb: 1,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                }}>
                  <strong>Previous Balance:</strong> Rs {(slip.previousBalance || 0).toLocaleString()}
                </Typography>
              )}
              {slip.partialPayment > 0 && (
                <Typography sx={{ 
                  mb: 1,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                  color: 'success.main'
                }}>
                  <strong>Customer Paid:</strong> Rs {(slip.partialPayment || 0).toLocaleString()}
                </Typography>
              )}
              <Typography sx={{ 
                mb: 1,
                fontSize: { xs: '1rem', sm: '1.125rem' },
                fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
                color: 'warning.main',
                fontWeight: 'bold'
              }}>
                <strong>Remaining Balance:</strong> Rs {((slip.currentBalance || slip.totalAmount || 0) - (slip.partialPayment || 0)).toLocaleString()}
              </Typography>
            </>
          )}
          <Typography variant="h5" sx={{ 
            mt: { xs: 1, sm: 2 },
            color: 'success.main',
            fontWeight: 'bold',
            fontSize: { xs: '1.25rem', sm: '1.5rem' },
            fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
            '@media print': {
              color: '#000'
            }
          }}>
            <strong>Payable Amount: Rs {slip.totalAmount?.toLocaleString()}</strong>
          </Typography>
        </Box>

        {slip.notes && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="body2">
              <strong>Notes:</strong> {slip.notes}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default SlipPage;