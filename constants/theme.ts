export const Theme = {
  dark: {
    background: '#facc15', // Yellow
    card: '#ffffff', // Pure White
    text: '#171717', // Near Black
    textMuted: '#525252', // Dark Gray
    primary: '#16a34a', // Darker Green
    secondary: '#8b5cf6', // Purple
    accent: '#eab308', // Yellow
    border: '#171717',
    glass: 'rgba(23, 23, 23, 0.05)',
    gradient: ['#16a34a', '#8b5cf6'] as [string, string, ...string[]],
  },
  light: {
    background: '#facc15', // Yellow
    card: '#ffffff',
    text: '#171717',
    textMuted: '#525252',
    primary: '#16a34a',
    secondary: '#8b5cf6',
    accent: '#eab308',
    border: '#171717',
    glass: 'rgba(23, 23, 23, 0.05)',
    gradient: ['#16a34a', '#8b5cf6'] as [string, string, ...string[]],
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

