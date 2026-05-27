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
