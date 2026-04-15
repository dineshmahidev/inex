export const Theme = {
  dark: {
    background: '#000000',
    card: '#121212',
    text: '#FFFFFF',
    textMuted: '#A0A0A0',
    primary: '#FF7A00', // Vivid Orange
    secondary: '#FF4500', 
    accent: '#FF7A00',
    border: '#262626',
    glass: 'rgba(255, 122, 0, 0.05)',
    gradient: ['#FF7A00', '#FF7A00'] as [string, string, ...string[]],
  },
  light: {
    background: '#FFFFFF',
    card: '#F8F8F8',
    text: '#000000',
    textMuted: '#666666',
    primary: '#FF7A00',
    secondary: '#FF4500',
    accent: '#FF7A00',
    border: '#E8E8E8',
    glass: 'rgba(255, 122, 0, 0.05)',
    gradient: ['#FF7A00', '#FF7A00'] as [string, string, ...string[]],
  }
};

// Legacy support for existing components
export const Colors = Theme.dark;
export const Currency = '₹';
