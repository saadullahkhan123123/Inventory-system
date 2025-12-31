// Valid Form Combinations Configuration
// This defines all valid combinations of Company, Form Type, Bike, and Variant

export const FORM_COMPANIES = ['AG', 'MR', 'UC', 'MASTER'];
export const FORM_TYPES = ['Soft', 'Hard'];
export const FORM_BIKES = ['70', '91', 'CD', '125', '150', '110'];

// Valid combinations structure
export const VALID_FORM_COMBINATIONS = {
  'AG': {
    'Soft': {
      variants: ['850gm', '700gm', '850gm (Bike: 125)', 'A+-'],
      bikes: {
        '850gm': [], // No specific bike requirement
        '700gm': [],
        '850gm (Bike: 125)': ['125'],
        'A+-': []
      }
    },
    'Hard': {
      variants: ['Low Height', 'Full Height', 'Form (Bike: 125, 91)'],
      bikes: {
        'Low Height': [],
        'Full Height': [],
        'Form (Bike: 125, 91)': ['125', '91']
      }
    }
  },
  'MR': {
    'Soft': {
      variants: ['850gm', '700gm', 'Form (Bike: 125, CD, 91)'],
      bikes: {
        '850gm': [],
        '700gm': [],
        'Form (Bike: 125, CD, 91)': ['125', 'CD', '91']
      }
    },
    'Hard': {
      variants: [],
      bikes: {}
    }
  },
  'UC': {
    'Soft': {
      variants: ['1050gm'],
      bikes: {
        '1050gm': []
      }
    },
    'Hard': {
      variants: [],
      bikes: {}
    }
  },
  'MASTER': {
    'Soft': {
      variants: [
        '760gm (Bike: 70)',
        '820gm (Bike: 70)',
        '820gm (Bike: 125)',
        '820gm (Bike: 150)',
        '820gm (Bike: 110)',
        '820gm (Bike: cd)',
        '650gm (Bike: 70)',
        '550gm (Bike: 70)'
      ],
      bikes: {
        '760gm (Bike: 70)': ['70'],
        '820gm (Bike: 70)': ['70'],
        '820gm (Bike: 125)': ['125'],
        '820gm (Bike: 150)': ['150'],
        '820gm (Bike: 110)': ['110'],
        '820gm (Bike: cd)': ['CD'],
        '650gm (Bike: 70)': ['70'],
        '550gm (Bike: 70)': ['70']
      }
    },
    'Hard': {
      variants: ['650gm (Bike: 125)'],
      bikes: {
        '650gm (Bike: 125)': ['125']
      }
    }
  }
};

// Get available form types for a company
export const getFormTypesForCompany = (company) => {
  if (!company || !VALID_FORM_COMBINATIONS[company]) return [];
  return Object.keys(VALID_FORM_COMBINATIONS[company]).filter(type => 
    VALID_FORM_COMBINATIONS[company][type].variants.length > 0
  );
};

// Get available variants for a company and form type
export const getVariantsForCompanyAndType = (company, formType) => {
  if (!company || !formType || !VALID_FORM_COMBINATIONS[company] || !VALID_FORM_COMBINATIONS[company][formType]) {
    return [];
  }
  return VALID_FORM_COMBINATIONS[company][formType].variants || [];
};

// Get available bikes for a company, form type, and variant
export const getBikesForVariant = (company, formType, variant) => {
  if (!company || !formType || !variant || !VALID_FORM_COMBINATIONS[company] || 
      !VALID_FORM_COMBINATIONS[company][formType] || 
      !VALID_FORM_COMBINATIONS[company][formType].bikes[variant]) {
    return FORM_BIKES; // Return all bikes if no specific requirement
  }
  
  const requiredBikes = VALID_FORM_COMBINATIONS[company][formType].bikes[variant];
  if (requiredBikes.length === 0) {
    return FORM_BIKES; // No specific bike requirement, return all
  }
  return requiredBikes;
};

// Check if a combination is valid
export const isValidFormCombination = (company, formType, variant, bikeName) => {
  if (!company || !formType || !variant) return false;
  
  if (!VALID_FORM_COMBINATIONS[company] || !VALID_FORM_COMBINATIONS[company][formType]) {
    return false;
  }
  
  const variants = VALID_FORM_COMBINATIONS[company][formType].variants || [];
  if (!variants.includes(variant)) {
    return false;
  }
  
  const requiredBikes = VALID_FORM_COMBINATIONS[company][formType].bikes[variant] || [];
  if (requiredBikes.length === 0) {
    return true; // No specific bike requirement
  }
  
  // Normalize bike name (handle case differences)
  const normalizedBike = bikeName?.toUpperCase() === 'CD' ? 'CD' : bikeName;
  return requiredBikes.includes(normalizedBike);
};

