import { MD3LightTheme, configureFonts } from 'react-native-paper';
import { DarkTheme, DefaultTheme, Theme } from '@react-navigation/native';

export const COLORS = {
  primary: '#0079C2',
  secondary: '#F7A11A',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#1A1A1A',
  error: '#B00020',
  success: '#4CAF50',
  grey: '#9E9E9E',
  lightGrey: '#E0E0E0',
  statusBar: '#006BA8', // Slightly darker than primary for status bar
  navigationBar: '#FFFFFF',
  navigationText: '#0079C2',
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: COLORS.primary,
    secondary: COLORS.secondary,
    background: COLORS.background,
    surface: COLORS.surface,
    error: COLORS.error,
    card: COLORS.navigationBar,
    text: COLORS.navigationText,
  },
  roundness: 12,
};

export const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.primary,
    background: COLORS.background,
    card: COLORS.navigationBar,
    text: COLORS.navigationText,
  },
};
