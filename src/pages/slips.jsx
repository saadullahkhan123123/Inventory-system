import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, TextField, Button, FormControl, InputLabel, Select,
  MenuItem, Snackbar, Alert, Card, CardContent, IconButton, CircularProgress, useMediaQuery, useTheme, Tooltip, Chip,
  Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import InfoIcon from '@mui/icons-material/Info';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { Link, useNavigate } from 'react-router-dom';
import { axiosApi } from '../utils/api';
import { useNotification } from '../utils/notifications';
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

const Slips = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Product structure with pricing
  const [formData, setFormData] = useState({
    customerName: '',
    paymentMethod: 'Cash', // Cash, Udhar, Account
    items: [{ 
      productType: 'Cover',
      coverType: '',
      plateCompany: '',
      bikeName: '',
      plateType: '',
      formCompany: '',
      formType: '',
      formVariant: '',
      formBikeName: '',
      category: '', 
      quantity: 1, 
      basePrice: 0,
      price: 0, 
      discountAmount: 0,
      discountType: 'none',
      total: 0, 
      subcategory: '', 
      company: '' 
    }]
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

  // Cover types eligible for bulk discount
  const bulkDiscountTypes = [
    'Aster Cover',
    'Without Aster Cover',
    'Calendar Cover'
  ];

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState({
    products: true,
    submission: false
  });

  const { notification, showNotification, hideNotification } = useNotification();

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axiosApi.items.getAll();
        const data = response.data?.items || response.data || [];

        setProducts(Array.isArray(data) ? data : []);
        const uniqueCategories = [...new Set(data.map(p => p.category || 'General'))];
        setCategories(uniqueCategories);
      } catch (error) {
        console.error('Error fetching products:', error);
        const errorMsg = error.response?.data?.error || error.message || 'Failed to load products';
        const errorDetails = error.code === 'ECONNABORTED' 
          ? 'Request timeout - backend may be slow or unreachable'
          : error.message === 'Network Error'
          ? 'Network error - check if backend is running'
          : errorMsg;
        showNotification('error', `Failed to load products: ${errorDetails}`);
      } finally {
        setLoading(prev => ({ ...prev, products: false }));
      }
    };
    fetchProducts();
  }, []);

  // Handle general input
  const handleInputChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Calculate bulk discount (only for Cover products, not Plate or Form)
  const calculateBulkDiscount = (productType, coverType, quantity, basePrice) => {
    // No bulk discount for Plate or Form products
    if (productType === 'Plate' || productType === 'Form') {
      return 0;
    }
    
    // Bulk discount only for specific cover types
    if (productType === 'Cover' && bulkDiscountTypes.includes(coverType) && quantity >= 10) {
      return 10; // 10 rupees discount per item
    }
    return 0;
  };

  // Calculate item pricing
  const calculateItemPricing = (item) => {
    const basePrice = item.basePrice || 0;
    const quantity = item.quantity || 1;
    const coverType = item.coverType || '';
    const productType = item.productType || 'Cover';
    
    // Calculate bulk discount if applicable (NOT for Plate products)
    let discountPerItem = 0;
    let discountType = 'none';
    
    if (productType === 'Cover' && coverType) {
      discountPerItem = calculateBulkDiscount(productType, coverType, quantity, basePrice);
      if (discountPerItem > 0) {
        discountType = 'bulk';
      }
    }
    // Plate products: No automatic bulk discount
    
    // If price was manually overridden, use that
    const finalPrice = item.price !== undefined && item.price !== (basePrice - discountPerItem) 
      ? item.price 
      : (basePrice - discountPerItem);
    
    // If manually set, it's a manual override
    if (item.price !== undefined && item.price !== (basePrice - discountPerItem)) {
      discountType = 'manual';
      discountPerItem = basePrice - finalPrice;
    }
    
    const totalDiscount = discountPerItem * quantity;
    const total = quantity * finalPrice;
    
    return {
      basePrice,
      unitPrice: finalPrice,
      discountAmount: totalDiscount,
      discountType,
      total
    };
  };

  // Check if two items are the same product (for merging)
  const isSameProduct = (item1, item2) => {
    if (!item1 || !item2) return false;
    
    // Must have same product type
    if (item1.productType !== item2.productType) return false;
    
    // For Cover products
    if (item1.productType === 'Cover') {
      return item1.coverType === item2.coverType;
    }
    
    // For Plate products
    if (item1.productType === 'Plate') {
      return (
        item1.bikeName === item2.bikeName &&
        item1.plateCompany === item2.plateCompany &&
        item1.plateType === item2.plateType
      );
    }
    
    // For Form products
    if (item1.productType === 'Form') {
      return (
        item1.formCompany === item2.formCompany &&
        item1.formType === item2.formType &&
        item1.formVariant === item2.formVariant &&
        item1.formBikeName === item2.formBikeName
      );
    }
    
    return false;
  };

  // Find product from inventory based on item attributes
  const findProductFromInventory = (item) => {
    if (!products || products.length === 0) return null;
    
    const productType = item.productType || '';
    
    // Try to find matching product based on product type and attributes
    const matchingProduct = products.find(product => {
      // Match by product type first (if product has a productType field)
      if (product.productType && product.productType !== productType) {
        return false;
      }
      
      // For Cover products, match by coverType
      if (productType === 'Cover' && item.coverType) {
        const productName = (product.name || '').toLowerCase();
        const coverType = (item.coverType || '').toLowerCase();
        // Check if product name contains the cover type
        if (productName.includes(coverType) || 
            (product.coverType && product.coverType.toLowerCase() === coverType)) {
          return true;
        }
      }
      
      // For Plate products, match by plateType, plateCompany, and bikeName
      if (productType === 'Plate') {
        let matches = true;
        if (item.plateType) {
          const productName = (product.name || '').toLowerCase();
          const plateType = (item.plateType || '').toLowerCase();
          if (!productName.includes(plateType) && 
              !(product.plateType && product.plateType.toLowerCase() === plateType)) {
            matches = false;
          }
        }
        if (item.plateCompany && matches) {
          if (product.plateCompany && product.plateCompany.toLowerCase() !== (item.plateCompany || '').toLowerCase()) {
            matches = false;
          }
        }
        if (item.bikeName && matches) {
          if (product.bikeName && product.bikeName.toLowerCase() !== (item.bikeName || '').toLowerCase()) {
            matches = false;
          }
        }
        if (matches) return true;
      }
      
      // For Form products, match by formVariant, formType, and formCompany
      if (productType === 'Form') {
        let matches = true;
        if (item.formVariant) {
          const productName = (product.name || '').toLowerCase();
          const formVariant = (item.formVariant || '').toLowerCase();
          if (!productName.includes(formVariant) && 
              !(product.formVariant && product.formVariant.toLowerCase() === formVariant)) {
            matches = false;
          }
        }
        if (item.formType && matches) {
          if (product.formType && product.formType.toLowerCase() !== (item.formType || '').toLowerCase()) {
            matches = false;
          }
        }
        if (item.formCompany && matches) {
          if (product.formCompany && product.formCompany.toLowerCase() !== (item.formCompany || '').toLowerCase()) {
            matches = false;
          }
        }
        if (matches) return true;
      }
      
      // Match by category if provided
      if (item.category && product.category) {
        if (product.category.toLowerCase() === (item.category || '').toLowerCase()) {
          // Additional matching based on product type
          if (!productType || (product.productType && product.productType === productType)) {
            return true;
          }
        }
      }
      
      // Match by name if it contains product type
      if (product.name) {
        const productName = product.name.toLowerCase();
        if (productType && productName.includes(productType.toLowerCase())) {
          return true;
        }
      }
      
      return false;
    });
    
    return matchingProduct || null;
  };

  // Merge duplicate products in items array
  const mergeDuplicateProducts = (items) => {
    const merged = [];
    const processed = new Set();
    
    items.forEach((item, index) => {
      // Skip if already processed
      if (processed.has(index)) return;
      
      // Find all items with same product attributes
      const duplicates = [index];
      for (let i = index + 1; i < items.length; i++) {
        if (!processed.has(i) && isSameProduct(item, items[i])) {
          duplicates.push(i);
        }
      }
      
      // If only one item, add as is
      if (duplicates.length === 1) {
        merged.push({ ...item });
        processed.add(index);
        return;
      }
      
      // Merge duplicates
      const baseItem = { ...item };
      let totalQuantity = item.quantity || 0;
      let latestPrice = item.price || item.basePrice || 0;
      let latestBasePrice = item.basePrice || 0;
      
      // Sum quantities and get latest price (use the last one's price if different)
      duplicates.forEach(dupIndex => {
        const dupItem = items[dupIndex];
        totalQuantity += (dupItem.quantity || 0);
        // Use the latest price (from last duplicate) if prices are different
        if (dupItem.price || dupItem.basePrice) {
          const dupPrice = dupItem.price || dupItem.basePrice || 0;
          if (dupPrice !== latestPrice) {
            latestPrice = dupPrice;
            latestBasePrice = dupItem.basePrice || 0;
          }
        }
        processed.add(dupIndex);
      });
      
      // Update base item with merged data
      baseItem.quantity = totalQuantity;
      baseItem.price = latestPrice;
      baseItem.basePrice = latestBasePrice;
      
      // Recalculate pricing
      const pricing = calculateItemPricing(baseItem);
      merged.push({ ...baseItem, ...pricing });
    });
    
    return merged;
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];

    if (field === 'productType') {
      updatedItems[index] = { 
        ...updatedItems[index],
        productType: value,
        coverType: value !== 'Cover' ? '' : updatedItems[index].coverType,
        plateCompany: value !== 'Plate' ? '' : updatedItems[index].plateCompany,
        bikeName: value !== 'Plate' ? '' : updatedItems[index].bikeName,
        plateType: value !== 'Plate' ? '' : updatedItems[index].plateType,
        formCompany: value !== 'Form' ? '' : updatedItems[index].formCompany,
        formType: value !== 'Form' ? '' : updatedItems[index].formType,
        formVariant: value !== 'Form' ? '' : updatedItems[index].formVariant,
        formBikeName: value !== 'Form' ? '' : updatedItems[index].formBikeName,
        basePrice: 0,
        price: 0,
        total: 0,
        discountAmount: 0,
        discountType: 'none'
      };
      // Try to auto-find product after productType change
      const foundProduct = findProductFromInventory(updatedItems[index]);
      if (foundProduct) {
        updatedItems[index].basePrice = foundProduct.basePrice || foundProduct.price || 0;
        updatedItems[index].price = foundProduct.price || foundProduct.basePrice || 0;
        updatedItems[index].category = foundProduct.category || '';
        updatedItems[index].subcategory = foundProduct.subcategory || '';
        updatedItems[index].company = foundProduct.company || '';
      }
      const pricing = calculateItemPricing(updatedItems[index]);
      updatedItems[index] = { ...updatedItems[index], ...pricing };
    } else if (field === 'coverType') {
      updatedItems[index].coverType = value;
      // Auto-find product and set price
      const foundProduct = findProductFromInventory({ ...updatedItems[index], coverType: value });
      if (foundProduct) {
        updatedItems[index].basePrice = foundProduct.basePrice || foundProduct.price || 0;
        updatedItems[index].price = foundProduct.price || foundProduct.basePrice || 0;
        updatedItems[index].category = foundProduct.category || '';
        updatedItems[index].subcategory = foundProduct.subcategory || '';
        updatedItems[index].company = foundProduct.company || '';
      }
      // Recalculate pricing when cover type changes
      const pricing = calculateItemPricing(updatedItems[index]);
      updatedItems[index] = { ...updatedItems[index], ...pricing };
    } else if (field === 'plateCompany') {
      updatedItems[index].plateCompany = value;
      updatedItems[index].plateType = ''; // Reset plate type when company changes
      // Auto-find product and set price
      const foundProduct = findProductFromInventory({ ...updatedItems[index], plateCompany: value });
      if (foundProduct) {
        updatedItems[index].basePrice = foundProduct.basePrice || foundProduct.price || 0;
        updatedItems[index].price = foundProduct.price || foundProduct.basePrice || 0;
        updatedItems[index].category = foundProduct.category || '';
        updatedItems[index].subcategory = foundProduct.subcategory || '';
        updatedItems[index].company = foundProduct.company || '';
      }
      const pricing = calculateItemPricing(updatedItems[index]);
      updatedItems[index] = { ...updatedItems[index], ...pricing };
    } else if (field === 'bikeName') {
      updatedItems[index].bikeName = value;
      // Reset dependent fields
      if (value !== '70') {
        updatedItems[index].plateCompany = '';
      }
      updatedItems[index].plateType = '';
      // Auto-find product and set price
      const foundProduct = findProductFromInventory({ ...updatedItems[index], bikeName: value });
      if (foundProduct) {
        updatedItems[index].basePrice = foundProduct.basePrice || foundProduct.price || 0;
        updatedItems[index].price = foundProduct.price || foundProduct.basePrice || 0;
        updatedItems[index].category = foundProduct.category || '';
        updatedItems[index].subcategory = foundProduct.subcategory || '';
        updatedItems[index].company = foundProduct.company || '';
      }
      const pricing = calculateItemPricing(updatedItems[index]);
      updatedItems[index] = { ...updatedItems[index], ...pricing };
    } else if (field === 'plateType') {
      updatedItems[index].plateType = value;
      // Auto-find product and set price
      const foundProduct = findProductFromInventory({ ...updatedItems[index], plateType: value });
      if (foundProduct) {
        updatedItems[index].basePrice = foundProduct.basePrice || foundProduct.price || 0;
        updatedItems[index].price = foundProduct.price || foundProduct.basePrice || 0;
        updatedItems[index].category = foundProduct.category || '';
        updatedItems[index].subcategory = foundProduct.subcategory || '';
        updatedItems[index].company = foundProduct.company || '';
      }
      const pricing = calculateItemPricing(updatedItems[index]);
      updatedItems[index] = { ...updatedItems[index], ...pricing };
    } else if (field === 'formCompany') {
      updatedItems[index].formCompany = value;
      updatedItems[index].formType = ''; // Reset form type
      updatedItems[index].formVariant = ''; // Reset variant
      updatedItems[index].formBikeName = ''; // Reset bike
      // Auto-find product and set price
      const foundProduct = findProductFromInventory({ ...updatedItems[index], formCompany: value });
      if (foundProduct) {
        updatedItems[index].basePrice = foundProduct.basePrice || foundProduct.price || 0;
        updatedItems[index].price = foundProduct.price || foundProduct.basePrice || 0;
        updatedItems[index].category = foundProduct.category || '';
        updatedItems[index].subcategory = foundProduct.subcategory || '';
        updatedItems[index].company = foundProduct.company || '';
      }
      const pricing = calculateItemPricing(updatedItems[index]);
      updatedItems[index] = { ...updatedItems[index], ...pricing };
    } else if (field === 'formType') {
      updatedItems[index].formType = value;
      updatedItems[index].formVariant = ''; // Reset variant
      updatedItems[index].formBikeName = ''; // Reset bike
      // Auto-find product and set price
      const foundProduct = findProductFromInventory({ ...updatedItems[index], formType: value });
      if (foundProduct) {
        updatedItems[index].basePrice = foundProduct.basePrice || foundProduct.price || 0;
        updatedItems[index].price = foundProduct.price || foundProduct.basePrice || 0;
        updatedItems[index].category = foundProduct.category || '';
        updatedItems[index].subcategory = foundProduct.subcategory || '';
        updatedItems[index].company = foundProduct.company || '';
      }
      const pricing = calculateItemPricing(updatedItems[index]);
      updatedItems[index] = { ...updatedItems[index], ...pricing };
    } else if (field === 'formVariant') {
      updatedItems[index].formVariant = value;
      updatedItems[index].formBikeName = ''; // Reset bike
      // Auto-find product and set price
      const foundProduct = findProductFromInventory({ ...updatedItems[index], formVariant: value });
      if (foundProduct) {
        updatedItems[index].basePrice = foundProduct.basePrice || foundProduct.price || 0;
        updatedItems[index].price = foundProduct.price || foundProduct.basePrice || 0;
        updatedItems[index].category = foundProduct.category || '';
        updatedItems[index].subcategory = foundProduct.subcategory || '';
        updatedItems[index].company = foundProduct.company || '';
      }
      const pricing = calculateItemPricing(updatedItems[index]);
      updatedItems[index] = { ...updatedItems[index], ...pricing };
    } else if (field === 'formBikeName') {
      updatedItems[index].formBikeName = value;
      // Auto-find product and set price
      const foundProduct = findProductFromInventory({ ...updatedItems[index], formBikeName: value });
      if (foundProduct) {
        updatedItems[index].basePrice = foundProduct.basePrice || foundProduct.price || 0;
        updatedItems[index].price = foundProduct.price || foundProduct.basePrice || 0;
        updatedItems[index].category = foundProduct.category || '';
        updatedItems[index].subcategory = foundProduct.subcategory || '';
        updatedItems[index].company = foundProduct.company || '';
      }
      const pricing = calculateItemPricing(updatedItems[index]);
      updatedItems[index] = { ...updatedItems[index], ...pricing };
    } else if (field === 'category') {
      updatedItems[index].category = value;
      // Auto-find product and set price
      const foundProduct = findProductFromInventory({ ...updatedItems[index], category: value });
      if (foundProduct) {
        updatedItems[index].basePrice = foundProduct.basePrice || foundProduct.price || 0;
        updatedItems[index].price = foundProduct.price || foundProduct.basePrice || 0;
        updatedItems[index].subcategory = foundProduct.subcategory || '';
        updatedItems[index].company = foundProduct.company || '';
      }
      const pricing = calculateItemPricing(updatedItems[index]);
      updatedItems[index] = { ...updatedItems[index], ...pricing };
    } else if (field === 'quantity') {
      const qty = parseInt(value) || 0;
      updatedItems[index].quantity = qty;
      
      // Recalculate pricing (bulk discount may apply)
      const pricing = calculateItemPricing({ ...updatedItems[index], quantity: qty });
      updatedItems[index] = { ...updatedItems[index], ...pricing };
      
      // Check and merge duplicates after quantity change
      const merged = mergeDuplicateProducts(updatedItems);
      setFormData(prev => ({ ...prev, items: merged }));
      return;
    } else if (field === 'price') {
      // Manual price override
      const manualPrice = parseFloat(value) || 0;
      updatedItems[index].price = manualPrice;
      updatedItems[index].discountType = 'manual';
      
      // Recalculate with manual price
      const pricing = calculateItemPricing({ ...updatedItems[index], price: manualPrice });
      updatedItems[index] = { ...updatedItems[index], ...pricing, price: manualPrice };
      
      // Check and merge duplicates after price change
      const merged = mergeDuplicateProducts(updatedItems);
      setFormData(prev => ({ ...prev, items: merged }));
      return;
    }

    // After any field change, check if we should merge duplicates
    // Only merge if the item is complete (has all required fields)
    const currentItem = updatedItems[index];
    let shouldMerge = false;
    
    if (currentItem.productType === 'Cover' && currentItem.coverType && currentItem.quantity > 0) {
      shouldMerge = true;
    } else if (currentItem.productType === 'Plate' && currentItem.bikeName && currentItem.plateType && currentItem.quantity > 0) {
      shouldMerge = true;
    } else if (currentItem.productType === 'Form' && currentItem.formCompany && currentItem.formType && currentItem.formVariant && currentItem.quantity > 0) {
      shouldMerge = true;
    }
    
    if (shouldMerge) {
      const beforeCount = updatedItems.length;
      const merged = mergeDuplicateProducts(updatedItems, true);
      const afterCount = merged.length;
      
      // Only show notification if items were actually merged
      if (beforeCount > afterCount) {
        showNotification('info', `Same products merged. Quantities added together.`);
      }
      
      setFormData(prev => ({ ...prev, items: merged }));
    } else {
      setFormData(prev => ({ ...prev, items: updatedItems }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        productType: 'Cover',
        coverType: '',
        plateCompany: '',
        bikeName: '',
        plateType: '',
        formCompany: '',
        formType: '',
        formVariant: '',
        formBikeName: '',
        category: '', 
        quantity: 1, 
        basePrice: 0,
        price: 0, 
        total: 0, 
        subcategory: '', 
        company: '',
        discountAmount: 0,
        discountType: 'none'
      }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const updated = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: updated }));
    }
  };

  // Calculate totals using pricing function
  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      const pricing = calculateItemPricing(item);
      return sum + pricing.total;
    }, 0);
    const totalAmount = subtotal;
    return { subtotal, totalAmount };
  };

  // ✔ UPDATED VALIDATION
  const validateForm = () => {
    if (!formData.customerName.trim()) {
      showNotification('error', 'Enter customer name.');
      return false;
    }

    for (const item of formData.items) {
      if (!item.productType) {
        showNotification('error', 'Select product type for all items.');
        return false;
      }
      if (item.productType === 'Cover' && !item.coverType) {
        showNotification('error', 'Select cover type for all Cover items.');
        return false;
      }
      if (item.productType === 'Form') {
        if (!item.formCompany) {
          showNotification('error', 'Select company for all Form items.');
          return false;
        }
        if (!item.formType) {
          showNotification('error', 'Select form type for all Form items.');
          return false;
        }
        if (!item.formVariant) {
          showNotification('error', 'Select form variant for all Form items.');
          return false;
        }
        // Validate combination
        if (!isValidFormCombination(item.formCompany, item.formType, item.formVariant, item.formBikeName || '')) {
          showNotification('error', 'Invalid Form combination. Please check Company, Form Type, Variant, and Bike.');
          return false;
        }
      }
      if (item.productType === 'Plate') {
        if (!item.bikeName) {
          showNotification('error', 'Select bike name for all Plate items.');
          return false;
        }
        if (item.bikeName !== 'Plastic Plate') {
          if (item.bikeName === '70' && !item.plateCompany) {
            showNotification('error', 'Select company for Bike 70.');
            return false;
          }
          if (!item.plateType) {
            showNotification('error', 'Select plate type for all Plate items (except Plastic Plate).');
            return false;
          }
          // Validate combination
          if (!isValidPlateCombination(item.bikeName, item.plateCompany || '', item.plateType)) {
            showNotification('error', 'Invalid Plate combination. Please check Company, Bike, and Plate Type.');
            return false;
          }
        }
      }
      if (item.quantity <= 0) {
        showNotification('error', 'Quantity must be greater than 0.');
        return false;
      }
      if (!item.basePrice || item.basePrice <= 0) {
        showNotification('error', 'Base price must be greater than 0.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(prev => ({ ...prev, submission: true }));

    try {
      const productsData = formData.items.map(item => {
        const foundProduct = findProductFromInventory(item);
        const pricing = calculateItemPricing(item);
        
        // Generate product name from attributes
        let productName = '';
        if (item.productType === 'Cover' && item.coverType) {
          productName = `${item.productType} - ${item.coverType}`;
        } else if (item.productType === 'Plate' && item.plateType) {
          productName = `${item.productType} - ${item.plateType}${item.bikeName ? ` (${item.bikeName})` : ''}`;
        } else if (item.productType === 'Form' && item.formVariant) {
          productName = `${item.productType} - ${item.formVariant}${item.formCompany ? ` (${item.formCompany})` : ''}`;
        } else {
          productName = item.productType || 'Product';
        }
        
        return {
          productName: foundProduct?.name || productName,
          productType: item.productType || 'Cover',
          coverType: item.productType === 'Cover' ? (item.coverType || '') : '',
          plateCompany: item.productType === 'Plate' ? (item.plateCompany || '') : '',
          bikeName: item.productType === 'Plate' ? (item.bikeName || '') : (item.productType === 'Form' ? (item.formBikeName || '') : ''),
          plateType: item.productType === 'Plate' ? (item.plateType || '') : '',
          formCompany: item.productType === 'Form' ? (item.formCompany || '') : '',
          formType: item.productType === 'Form' ? (item.formType || '') : '',
          formVariant: item.productType === 'Form' ? (item.formVariant || '') : '',
          quantity: item.quantity,
          basePrice: item.basePrice || 0,
          unitPrice: pricing.unitPrice,
          discountAmount: pricing.discountAmount,
          discountType: pricing.discountType,
          totalPrice: pricing.total,
          category: item.category || '',
          subcategory: item.subcategory || '',
          company: item.company || ''
        };
      });

      const { subtotal, totalAmount } = calculateTotals();

      // ✔ UPDATED — ONLY SEND WHAT BACKEND ACCEPTS
      const slipData = {
        customerName: formData.customerName,
        paymentMethod: formData.paymentMethod || 'Cash',
        products: productsData,
        subtotal,
        totalAmount
      };

      const response = await axiosApi.slips.create(slipData);
      const createdSlip = response.data;

      showNotification('success', 'Slip created successfully!');
      navigate(`/slips/${createdSlip.slip._id}`);

      // Reset form
      setFormData({
        customerName: '',
        paymentMethod: 'Cash',
        items: [{ 
          productType: 'Cover',
          coverType: '',
          plateCompany: '',
          bikeName: '',
          plateType: '',
          formCompany: '',
          formType: '',
          formVariant: '',
          formBikeName: '',
          category: '', 
          quantity: 1, 
          basePrice: 0,
          price: 0, 
          total: 0, 
          subcategory: '', 
          company: '',
          discountAmount: 0,
          discountType: 'none'
        }]
      });

    } catch (err) {
      console.error('Slip creation error:', err);
      const errorMsg = err.response?.data?.error ||
                       err.response?.data?.details ||
                       err.message ||
                       'Failed to create slip';
      showNotification('error', errorMsg);
    } finally {
      setLoading(prev => ({ ...prev, submission: false }));
    }
  };

  const { subtotal, totalAmount } = calculateTotals();

  if (loading.products) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading products...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      maxWidth: 1200, 
      mx: 'auto', 
      mt: { xs: 0.5, sm: 1, md: 2 }, 
      p: { xs: 1, sm: 1.5, md: 3 },
      minHeight: '100vh',
      background: 'linear-gradient(to bottom, #f5f7fa 0%, #ffffff 100%)',
      pb: { xs: 2, sm: 3 }
    }}>
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography variant="h4" fontWeight="bold" sx={{ 
          background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 1,
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
        }}>
          Create Sales Slip
        </Typography>
        <Typography variant="subtitle1" color="textSecondary" sx={{
          fontSize: { xs: '0.875rem', sm: '1rem' },
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
        }}>
          Add products and create a new sales slip for your customer
        </Typography>
      </Box>

      <Paper sx={{ 
        p: { xs: 1.5, sm: 2.5, md: 4 }, 
        mt: { xs: 1, sm: 2 },
        borderRadius: { xs: 2, sm: 3 },
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        mx: { xs: 0.5, sm: 0 }
      }} elevation={0}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>

            {/* Customer Name */}
            <Grid item xs={12} sm={6}>
              <Tooltip title="Enter the name of the customer for this slip" arrow placement="top">
              <TextField
                fullWidth
                label="Customer Name *"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                required
                  InputProps={{
                    endAdornment: (
                      <Tooltip title="Required field" arrow>
                        <InfoIcon sx={{ color: 'text.secondary', fontSize: '1rem', ml: 1 }} />
                      </Tooltip>
                    )
                  }}
                />
              </Tooltip>
            </Grid>

            {/* Payment Method */}
            <Grid item xs={12} sm={6}>
              <Tooltip title="Select payment method for this slip" arrow placement="top">
                <FormControl fullWidth required>
                  <InputLabel>Payment Method *</InputLabel>
                  <Select
                    name="paymentMethod"
                    value={formData.paymentMethod || 'Cash'}
                    onChange={handleInputChange}
                    label="Payment Method *"
                  >
                    <MenuItem value="Cash">Cash</MenuItem>
                    <MenuItem value="Udhar">Udhar (Credit)</MenuItem>
                    <MenuItem value="Account">Account</MenuItem>
                  </Select>
                </FormControl>
              </Tooltip>
            </Grid>

            {/* Items */}
            <Grid item xs={12}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 },
                mb: 2 
              }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold',
                  fontSize: { xs: '1rem', sm: '1.25rem' },
                  fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif'
                }}>
                  Items ({formData.items.length})
                </Typography>
                <Tooltip title="Add another product to this slip" arrow>
                <Button 
                  variant="outlined" 
                  startIcon={<AddIcon />} 
                  onClick={addItem}
                    sx={{ 
                      borderRadius: 2,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      px: { xs: 1.5, sm: 2 },
                      py: { xs: 0.75, sm: 1 }
                    }}
                >
                  Add Item
                </Button>
                </Tooltip>
              </Box>
            </Grid>

            {formData.items.map((item, index) => {
              const pricing = calculateItemPricing(item);
              
              return (
              <Grid item xs={12} key={index}>
                <Card variant="outlined" sx={{
                  borderRadius: 2,
                  border: '1px solid #e0e0e0',
                  '&:hover': {
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    borderColor: 'primary.main'
                  },
                  transition: 'all 0.2s ease-in-out',
                  background: pricing.discountAmount > 0 ? 'linear-gradient(135deg, #fff9e6 0%, #ffffff 100%)' : 'white'
                }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      {/* Product Type */}
                      <Grid item xs={12} sm={6} md={2}>
                        <Tooltip title="Select product type: Cover, Form, or Plate" arrow>
                          <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                            <InputLabel>Product Type *</InputLabel>
                            <Select
                              value={item.productType || 'Cover'}
                              onChange={(e) => handleItemChange(index, 'productType', e.target.value)}
                              label="Product Type *"
                            >
                              <MenuItem value="Cover">Cover</MenuItem>
                              <MenuItem value="Form">Form</MenuItem>
                              <MenuItem value="Plate">Plate</MenuItem>
                            </Select>
                          </FormControl>
                        </Tooltip>
                      </Grid>

                      {/* Cover Type - Only if Product Type is Cover */}
                      {item.productType === 'Cover' && (
                        <Grid item xs={12} sm={6} md={2}>
                          <Tooltip title="Select the specific cover type. Required for bulk discount eligibility." arrow>
                            <FormControl fullWidth size={isMobile ? 'small' : 'medium'}>
                              <InputLabel>Cover Type *</InputLabel>
                              <Select
                                value={item.coverType || ''}
                                onChange={(e) => handleItemChange(index, 'coverType', e.target.value)}
                                label="Cover Type *"
                              >
                                <MenuItem value="">Select Cover Type</MenuItem>
                                {coverTypes.map(type => (
                                  <MenuItem key={type} value={type}>
                                    {type}
                                    {bulkDiscountTypes.includes(type) && (
                                      <Chip 
                                        label="Bulk" 
                                        size="small" 
                                        color="success" 
                                        sx={{ ml: 1, fontSize: '0.65rem', height: '18px' }} 
                                      />
                                    )}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          </Tooltip>
                        </Grid>
                      )}

                      {/* Plate Fields - Only if Product Type is Plate */}
                      {item.productType === 'Plate' && (
                        <>
                          {/* Company - Only for Bike 70 */}
                          {item.bikeName === '70' && (
                            <Grid item xs={12} sm={6} md={1.5}>
                              <Tooltip title="Select company. Required for Bike 70." arrow>
                                <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                                  <InputLabel>Company *</InputLabel>
                                  <Select
                                    value={item.plateCompany || ''}
                                    onChange={(e) => handleItemChange(index, 'plateCompany', e.target.value)}
                                    label="Company *"
                                  >
                                    <MenuItem value="">Select Company</MenuItem>
                                    {PLATE_COMPANIES.map(company => (
                                      <MenuItem key={company} value={company}>{company}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Tooltip>
                            </Grid>
                          )}

                          {/* Bike Name */}
                          <Grid item xs={12} sm={6} md={item.bikeName === '70' ? 1.5 : 2}>
                            <Tooltip title="Select bike name. This filters available plate types." arrow>
                              <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                                <InputLabel>Bike Name *</InputLabel>
                                <Select
                                  value={item.bikeName || ''}
                                  onChange={(e) => handleItemChange(index, 'bikeName', e.target.value)}
                                  label="Bike Name *"
                                >
                                  <MenuItem value="">Select Bike</MenuItem>
                                  {PLATE_BIKES.map(bike => (
                                    <MenuItem key={bike} value={bike}>{bike}</MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Tooltip>
                          </Grid>

                          {/* Plate Type - Only if not Plastic Plate */}
                          {item.bikeName && item.bikeName !== 'Plastic Plate' && (
                            <Grid item xs={12} sm={6} md={item.bikeName === '70' ? 1.5 : 2}>
                              <Tooltip title="Select plate type based on bike and company selection." arrow>
                                <FormControl 
                                  fullWidth 
                                  required 
                                  size={isMobile ? 'small' : 'medium'}
                                  disabled={!item.bikeName || (item.bikeName === '70' && !item.plateCompany)}
                                >
                                  <InputLabel>Plate Type *</InputLabel>
                                  <Select
                                    value={item.plateType || ''}
                                    onChange={(e) => handleItemChange(index, 'plateType', e.target.value)}
                                    label="Plate Type *"
                                  >
                                    <MenuItem value="">Select Plate Type</MenuItem>
                                    {getPlateTypesForBikeAndCompany(item.bikeName, item.plateCompany).map(type => (
                                      <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Tooltip>
                            </Grid>
                          )}
                        </>
                      )}

                      {/* Form Fields - Only if Product Type is Form */}
                      {item.productType === 'Form' && (
                        <>
                          {/* Company */}
                          <Grid item xs={12} sm={6} md={2}>
                            <Tooltip title="Select company. Required for Form products." arrow>
                              <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                                <InputLabel>Company *</InputLabel>
                                <Select
                                  value={item.formCompany || ''}
                                  onChange={(e) => handleItemChange(index, 'formCompany', e.target.value)}
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
                          {item.formCompany && (
                            <Grid item xs={12} sm={6} md={2}>
                              <Tooltip title="Select form type (Soft or Hard)." arrow>
                                <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                                  <InputLabel>Form Type *</InputLabel>
                                  <Select
                                    value={item.formType || ''}
                                    onChange={(e) => handleItemChange(index, 'formType', e.target.value)}
                                    label="Form Type *"
                                  >
                                    <MenuItem value="">Select Form Type</MenuItem>
                                    {getFormTypesForCompany(item.formCompany).map(type => (
                                      <MenuItem key={type} value={type}>{type}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Tooltip>
                            </Grid>
                          )}

                          {/* Form Variant */}
                          {item.formCompany && item.formType && (
                            <Grid item xs={12} sm={6} md={2}>
                              <Tooltip title="Select form variant (weight, height, etc.)." arrow>
                                <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                                  <InputLabel>Form Variant *</InputLabel>
                                  <Select
                                    value={item.formVariant || ''}
                                    onChange={(e) => handleItemChange(index, 'formVariant', e.target.value)}
                                    label="Form Variant *"
                                  >
                                    <MenuItem value="">Select Variant</MenuItem>
                                    {getVariantsForCompanyAndType(item.formCompany, item.formType).map(variant => (
                                      <MenuItem key={variant} value={variant}>{variant}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Tooltip>
                            </Grid>
                          )}

                          {/* Bike Name - Only if variant requires specific bike */}
                          {item.formCompany && item.formType && item.formVariant && 
                           getBikesForVariant(item.formCompany, item.formType, item.formVariant).length < FORM_BIKES.length && (
                            <Grid item xs={12} sm={6} md={2}>
                              <Tooltip title="Select bike name if required for this variant." arrow>
                                <FormControl fullWidth required size={isMobile ? 'small' : 'medium'}>
                                  <InputLabel>Bike Name *</InputLabel>
                                  <Select
                                    value={item.formBikeName || ''}
                                    onChange={(e) => handleItemChange(index, 'formBikeName', e.target.value)}
                                    label="Bike Name *"
                                  >
                                    <MenuItem value="">Select Bike</MenuItem>
                                    {getBikesForVariant(item.formCompany, item.formType, item.formVariant).map(bike => (
                                      <MenuItem key={bike} value={bike}>{bike}</MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Tooltip>
                            </Grid>
                          )}
                        </>
                      )}

                      {/* Price Display - Auto-filled from inventory */}
                      {item.basePrice > 0 && (
                        <Grid item xs={12} sm={6} md={2}>
                          <Box sx={{ 
                            display: 'flex', 
                            flexDirection: 'column',
                            justifyContent: 'center',
                            height: '100%',
                            minHeight: { xs: '40px', sm: '56px' },
                            p: 1,
                            bgcolor: 'info.light',
                            borderRadius: 1
                          }}>
                            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                              Auto Price
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="info.main" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              Rs {item.basePrice?.toFixed(2) || '0.00'}
                            </Typography>
                          </Box>
                        </Grid>
                      )}

                      {/* Quantity */}
                      <Grid item xs={6} sm={4} md={1.5}>
                        <Tooltip title="Quantity. Bulk discount applies if 10+ for eligible cover types." arrow>
                        <TextField
                          fullWidth
                          label="Qty *"
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          inputProps={{ min: 1 }}
                            size={isMobile ? 'small' : 'medium'}
                          />
                        </Tooltip>
                      </Grid>

                      {/* Base Price Display */}
                      <Grid item xs={6} sm={4} md={1.5}>
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          justifyContent: 'center',
                          height: '100%',
                          minHeight: { xs: '40px', sm: '56px' }
                        }}>
                          <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                            Base Price
                          </Typography>
                          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            Rs {item.basePrice?.toFixed(2) || '0.00'}
                          </Typography>
                        </Box>
                      </Grid>

                      {/* Manual Price Override */}
                      <Grid item xs={12} sm={6} md={2}>
                        <Tooltip title="Override price manually. Leave empty to use base price with automatic discounts." arrow>
                          <TextField
                            fullWidth
                            label="Unit Price (Rs)"
                            type="number"
                            value={item.price || ''}
                            onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                            inputProps={{ min: 0, step: "0.01" }}
                            placeholder={item.basePrice?.toFixed(2) || "0.00"}
                            size={isMobile ? 'small' : 'medium'}
                            helperText={item.price && item.price !== pricing.unitPrice ? "Manual override" : ""}
                          />
                        </Tooltip>
                      </Grid>

                      {/* Price Breakdown */}
                      <Grid item xs={12} sm={6} md={3}>
                        <Box sx={{ 
                          display: 'flex', 
                          flexDirection: 'column',
                          justifyContent: 'center',
                          height: '100%',
                          minHeight: { xs: '40px', sm: '56px' },
                          p: 1,
                          bgcolor: pricing.discountAmount > 0 ? 'success.light' : 'grey.50',
                          borderRadius: 1
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.7rem' }}>
                              Original:
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                              Rs {(item.basePrice * item.quantity).toFixed(2)}
                            </Typography>
                          </Box>
                          {pricing.discountAmount > 0 && (
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="caption" color="success.main" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                                {pricing.discountType === 'bulk' ? 'Bulk Discount:' : 'Discount:'}
                              </Typography>
                              <Typography variant="caption" color="success.main" sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>
                                -Rs {pricing.discountAmount.toFixed(2)}
                              </Typography>
                            </Box>
                          )}
                          <Divider sx={{ my: 0.5 }} />
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="body2" fontWeight="bold" color="primary.main" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              Total:
                            </Typography>
                            <Typography variant="body2" fontWeight="bold" color="primary.main" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                              Rs {pricing.total.toFixed(2)}
                        </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Remove */}
                      <Grid item xs={12} sm={4} md={1}>
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: { xs: 'flex-start', sm: 'center' },
                          alignItems: 'center',
                          height: '100%',
                          minHeight: { xs: '40px', sm: '56px' }
                        }}>
                          <Tooltip title="Remove this item" arrow>
                        <IconButton
                          color="error"
                          onClick={() => removeItem(index)}
                          disabled={formData.items.length === 1}
                              size={isMobile ? 'small' : 'medium'}
                        >
                          <DeleteIcon />
                        </IconButton>
                          </Tooltip>
                        </Box>
                      </Grid>

                    </Grid>
                    
                    {/* Bulk Discount Indicator */}
                    {pricing.discountType === 'bulk' && (
                      <Box sx={{ 
                        mt: 1, 
                        p: 1, 
                        bgcolor: 'success.light', 
                        borderRadius: 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        <LocalOfferIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
                        <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold' }}>
                          Bulk Discount Applied: Rs {pricing.discountAmount.toFixed(2)} off (10+ quantity)
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )})}

            {/* Summary - Redesigned for Better Layout */}
            <Grid item xs={12}>
              <Card sx={{ 
                p: { xs: 2, sm: 3 }, 
                background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                color: 'white',
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(25, 118, 210, 0.3)'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" sx={{ opacity: 0.9, fontSize: { xs: '1rem', sm: '1.25rem' } }}>Order Summary</Typography>
                  <Chip 
                    label={`${formData.items.length} item(s)`}
                    sx={{ 
                      bgcolor: 'rgba(255,255,255,0.2)', 
                      color: 'white',
                      fontSize: { xs: '0.7rem', sm: '0.75rem' }
                    }} 
                  />
                </Box>
                
                <Box sx={{ mb: 2, maxHeight: { xs: '200px', sm: '300px' }, overflowY: 'auto' }}>
                  {formData.items.map((item, idx) => {
                    const pricing = calculateItemPricing(item);
                    const foundProduct = findProductFromInventory(item);
                    
                    // Generate product name
                    let productName = '';
                    if (item.productType === 'Cover' && item.coverType) {
                      productName = `${item.productType} - ${item.coverType}`;
                    } else if (item.productType === 'Plate' && item.plateType) {
                      productName = `${item.productType} - ${item.plateType}${item.bikeName ? ` (${item.bikeName})` : ''}`;
                    } else if (item.productType === 'Form' && item.formVariant) {
                      productName = `${item.productType} - ${item.formVariant}${item.formCompany ? ` (${item.formCompany})` : ''}`;
                    } else {
                      productName = item.productType || 'Product';
                    }
                    
                    return (
                      <Box key={idx} sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 1,
                        p: 1,
                        bgcolor: 'rgba(255,255,255,0.1)',
                        borderRadius: 1
                      }}>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ 
                            fontSize: { xs: '0.75rem', sm: '0.875rem' },
                            fontWeight: 'bold',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {foundProduct?.name || productName}
                          </Typography>
                          <Typography variant="caption" sx={{ 
                            fontSize: { xs: '0.65rem', sm: '0.75rem' },
                            opacity: 0.8
                          }}>
                            Qty: {item.quantity} × Rs {item.price?.toFixed(2) || 0}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: 'right', ml: 2 }}>
                          <Typography variant="body2" sx={{ 
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                            fontWeight: 'bold'
                          }}>
                            Rs {pricing.total.toFixed(2)}
                          </Typography>
                          {pricing.discountAmount > 0 && (
                            <Typography variant="caption" sx={{ 
                              fontSize: { xs: '0.65rem', sm: '0.7rem' },
                              opacity: 0.9,
                              display: 'block',
                              mt: 0.25
                            }}>
                              -Rs {pricing.discountAmount.toFixed(2)}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
                
                <Divider sx={{ my: 2, bgcolor: 'rgba(255,255,255,0.3)' }} />
                
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      Subtotal:
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      Rs {subtotal.toFixed(2)}
                    </Typography>
                  </Box>
                  {formData.items.some(item => {
                    const pricing = calculateItemPricing(item);
                    return pricing.discountAmount > 0;
                  }) && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        Total Discount:
                      </Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                        -Rs {formData.items.reduce((sum, item) => {
                          const pricing = calculateItemPricing(item);
                          return sum + pricing.discountAmount;
                        }, 0).toFixed(2)}
                      </Typography>
                    </Box>
                  )}
                  <Divider sx={{ my: 1.5, bgcolor: 'rgba(255,255,255,0.3)' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ opacity: 0.9, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      Total Amount
                    </Typography>
                    <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                      Rs {totalAmount.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>

            {/* Submit */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Tooltip title="Create and save this sales slip. Inventory will be automatically updated." arrow>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  endIcon={<SendIcon />}
                  disabled={loading.submission}
                  sx={{
                    minWidth: 200,
                    py: 1.5,
                    borderRadius: 2,
                    background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)',
                    },
                    boxShadow: '0 4px 15px rgba(25, 118, 210, 0.3)'
                  }}
                >
                  {loading.submission ? <CircularProgress size={24} color="inherit" /> : 'Create Slip'}
                </Button>
                </Tooltip>
              </Box>
            </Grid>

          </Grid>
        </form>
      </Paper>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={hideNotification}
      >
        <Alert severity={notification.severity} onClose={hideNotification}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Slips;
