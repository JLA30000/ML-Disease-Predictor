import { Platform } from 'react-native';

export const MedicalTheme = {
  colors: {
    // Primary CTA - clean blue
    primary: '#4F6BF6',
    primaryDark: '#3A54D4',
    primaryLight: '#EDF0FF',
    crimson: '#4F6BF6', // backward compat alias for primary

    // Purple accent
    purple: '#8B5CF6',
    purpleLight: '#EFE9FF',

    // Health / success - green
    green: '#10B981',
    greenLight: '#E7F9F1',

    // Light backgrounds — warm neutral base
    background: '#F4F3F0',
    surface: '#FEFEFE',
    surfaceHigh: '#EDECE8',

    // Text hierarchy
    text: '#1E293B',
    textSecondary: '#64748B',
    muted: '#94A3B8',

    // Borders — warm neutral
    border: '#E5E3DE',
    borderStrong: '#D2CFCA',

    // Warm / soothing tones
    cream: '#FDF8F3',
    creamDark: '#F3EBE1',
    creamText: '#8B7355',

    // Futuristic accent
    teal: '#0EA5E9',
    tealLight: '#E0F2FE',

    // Semantic alert colors
    alertRed: '#EF4444',
    alertRedBg: '#FEF2F2',
    alertAmber: '#F59E0B',
    alertGreen: '#10B981',
  },
  radius: {
    sm: 10,
    md: 14,
    lg: 18,
    xl: 24,
    xxl: 32,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 22,
    xl: 30,
    xxl: 40,
  },
  fonts: Platform.select({
    ios: {
      display: 'System',
      body: 'System',
    },
    android: {
      display: 'sans-serif',
      body: 'sans-serif',
    },
    default: {
      display: 'sans-serif',
      body: 'sans-serif',
    },
  }),
  shadow: {
    sm: {
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 4,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOpacity: 0.07,
      shadowOffset: { width: 0, height: 3 },
      shadowRadius: 10,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOpacity: 0.10,
      shadowOffset: { width: 0, height: 5 },
      shadowRadius: 16,
      elevation: 5,
    },
  },
};
