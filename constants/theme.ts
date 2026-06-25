export const Theme = {
  dark: {
    background: '#ffffff',
    card: '#ffffff',
    text: '#171717',
    textMuted: '#525252',
    primary: '#ff2d78',
    secondary: '#f472b6',
    accent: '#ec4899',
    border: '#e5e5e5',
    glass: 'rgba(255, 45, 120, 0.08)',
    gradient: ['#ff2d78', '#ec4899'] as [string, string, ...string[]],
  },
  light: {
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#171717',
    textMuted: '#525252',
    primary: '#ff2d78',
    secondary: '#f472b6',
    accent: '#ec4899',
    border: '#e5e5e5',
    glass: 'rgba(255, 45, 120, 0.08)',
    gradient: ['#ff2d78', '#ec4899'] as [string, string, ...string[]],
  }
};

// Legacy support for existing components
export const Colors = Theme.dark;
export const Currency = '₹';

export const formatWithCommas = (num: number | string): string => {
  if (num === undefined || num === null || isNaN(Number(num))) return '0';
  const val = Number(num);
  const parts = val.toFixed(2).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (parts[1] === '00') {
    return parts[0];
  }
  return `${parts[0]}.${parts[1]}`;
};

export const formatInputWithCommas = (text: string): string => {
  if (!text) return '';
  // Strip any non-digit, non-dot characters
  let clean = text.replace(/[^0-9.]/g, '');
  
  // Ensure only one decimal point
  const parts = clean.split('.');
  if (parts.length > 2) {
    clean = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Split to format the integer part
  const cleanParts = clean.split('.');
  let integerPart = cleanParts[0];
  let decimalPart = cleanParts[1];
  
  // Format integer part with commas
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  
  // If there is a decimal point in the clean input
  if (clean.includes('.')) {
    return decimalPart !== undefined ? `${integerPart}.${decimalPart}` : `${integerPart}.`;
  }
  return integerPart;
};

