// Valid Plate Combinations Configuration
// This defines all valid combinations of Company, Bike, and Plate Type

export const PLATE_COMPANIES = ['DY', 'AH', 'BELTA'];
export const PLATE_BIKES = ['70', 'CD', '125', 'Yamaha', 'Plastic Plate'];
export const PLATE_TYPES = ['Single', 'Double', 'Side', 'Lahore', 'Double (Gormore)'];

// Valid combinations structure
export const VALID_PLATE_COMBINATIONS = {
  '70': {
    companies: ['DY', 'AH', 'BELTA'],
    plateTypes: {
      'DY': ['Single'],
      'BELTA': ['Single'],
      'AH': ['Single', 'Double']
    }
  },
  'CD': {
    companies: [], // No company required
    plateTypes: {
      '': ['Single', 'Double', 'Side', 'Lahore'] // Empty string means no company
    }
  },
  '125': {
    companies: [], // No company required
    plateTypes: {
      '': ['Single', 'Double', 'Side', 'Lahore', 'Double (Gormore)']
    }
  },
  'Yamaha': {
    companies: [], // No company required
    plateTypes: {
      '': ['Single']
    }
  },
  'Plastic Plate': {
    companies: [], // Standalone product
    plateTypes: {
      '': [] // No plate type needed
    }
  }
};

// Get available companies for a bike
export const getCompaniesForBike = (bikeName) => {
  if (!bikeName || !VALID_PLATE_COMBINATIONS[bikeName]) return [];
  const config = VALID_PLATE_COMBINATIONS[bikeName];
  return config.companies || [];
};

// Get available plate types for a bike and company combination
export const getPlateTypesForBikeAndCompany = (bikeName, company = '') => {
  if (!bikeName || !VALID_PLATE_COMBINATIONS[bikeName]) return [];
  
  const config = VALID_PLATE_COMBINATIONS[bikeName];
  
  // For Plastic Plate, return empty (no plate type needed)
  if (bikeName === 'Plastic Plate') return [];
  
  // If company is required, get types for that company
  if (config.companies.length > 0) {
    return config.plateTypes[company] || [];
  }
  
  // If no company required, get types for empty company key
  return config.plateTypes[''] || [];
};

// Check if a combination is valid
export const isValidPlateCombination = (bikeName, company, plateType) => {
  if (!bikeName) return false;
  
  // Plastic Plate is always valid (standalone)
  if (bikeName === 'Plastic Plate') return true;
  
  if (!VALID_PLATE_COMBINATIONS[bikeName]) return false;
  
  const config = VALID_PLATE_COMBINATIONS[bikeName];
  
  // If company is required
  if (config.companies.length > 0) {
    if (!company || !config.companies.includes(company)) return false;
    const validTypes = config.plateTypes[company] || [];
    return validTypes.includes(plateType);
  }
  
  // If no company required
  const validTypes = config.plateTypes[''] || [];
  return validTypes.includes(plateType);
};

// Get all bikes that require a company
export const getBikesRequiringCompany = () => {
  return Object.keys(VALID_PLATE_COMBINATIONS).filter(bike => {
    const config = VALID_PLATE_COMBINATIONS[bike];
    return config.companies && config.companies.length > 0;
  });
};

