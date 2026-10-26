// ============================================================
// MtrTV - Theme & Design System
// Premium dark theme inspired by TiviMate
// ============================================================

import { ThemeMode } from '../types';

export interface Theme {
  colors: {
    // Base
    background: string;
    surface: string;
    surfaceVariant: string;
    card: string;
    cardHover: string;
    overlay: string;
    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    // Accent
    primary: string;
    primaryDark: string;
    primaryLight: string;
    secondary: string;
    accent: string;
    // Status
    success: string;
    warning: string;
    error: string;
    info: string;
    // Player
    playerBackground: string;
    playerControls: string;
    playerProgress: string;
    playerBuffer: string;
    // EPG
    epgBackground: string;
    epgCurrentTime: string;
    epgProgramActive: string;
    epgProgramPast: string;
    epgProgramFuture: string;
    // Navigation
    navBackground: string;
    navActive: string;
    navInactive: string;
    // Focus (TV remote)
    focusBorder: string;
    focusGlow: string;
    // Borders
    border: string;
    borderLight: string;
    // Gradients
    gradientStart: string;
    gradientEnd: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
    full: number;
  };
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    title: number;
    header: number;
  };
  fontWeight: {
    regular: string;
    medium: string;
    semibold: string;
    bold: string;
  };
}

const themes: Record<ThemeMode, Theme> = {
  dark: {
    colors: {
      background: '#0D0D0D',
      surface: '#1A1A2E',
      surfaceVariant: '#16213E',
      card: '#1E1E3A',
      cardHover: '#2A2A4A',
      overlay: 'rgba(0, 0, 0, 0.85)',
      textPrimary: '#FFFFFF',
      textSecondary: '#B0B0C8',
      textMuted: '#6B6B8D',
      textInverse: '#0D0D0D',
      primary: '#6C63FF',
      primaryDark: '#5046E5',
      primaryLight: '#8B83FF',
      secondary: '#00D9FF',
      accent: '#FF6B9D',
      success: '#00E676',
      warning: '#FFD740',
      error: '#FF5252',
      info: '#448AFF',
      playerBackground: '#000000',
      playerControls: 'rgba(0, 0, 0, 0.7)',
      playerProgress: '#6C63FF',
      playerBuffer: 'rgba(108, 99, 255, 0.3)',
      epgBackground: '#0F0F1E',
      epgCurrentTime: '#FF6B9D',
      epgProgramActive: '#6C63FF',
      epgProgramPast: '#2A2A3E',
      epgProgramFuture: '#1E1E3A',
      navBackground: '#0F0F1E',
      navActive: '#6C63FF',
      navInactive: '#6B6B8D',
      focusBorder: '#6C63FF',
      focusGlow: 'rgba(108, 99, 255, 0.4)',
      border: '#2A2A4A',
      borderLight: '#3A3A5A',
      gradientStart: '#6C63FF',
      gradientEnd: '#00D9FF',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
    borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, full: 999 },
    fontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, xxl: 24, title: 28, header: 32 },
    fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  },
  amoled: {
    colors: {
      background: '#000000',
      surface: '#0A0A0A',
      surfaceVariant: '#111111',
      card: '#141414',
      cardHover: '#1E1E1E',
      overlay: 'rgba(0, 0, 0, 0.95)',
      textPrimary: '#FFFFFF',
      textSecondary: '#999999',
      textMuted: '#555555',
      textInverse: '#000000',
      primary: '#6C63FF',
      primaryDark: '#5046E5',
      primaryLight: '#8B83FF',
      secondary: '#00D9FF',
      accent: '#FF6B9D',
      success: '#00E676',
      warning: '#FFD740',
      error: '#FF5252',
      info: '#448AFF',
      playerBackground: '#000000',
      playerControls: 'rgba(0, 0, 0, 0.8)',
      playerProgress: '#6C63FF',
      playerBuffer: 'rgba(108, 99, 255, 0.3)',
      epgBackground: '#000000',
      epgCurrentTime: '#FF6B9D',
      epgProgramActive: '#6C63FF',
      epgProgramPast: '#1A1A1A',
      epgProgramFuture: '#0F0F0F',
      navBackground: '#000000',
      navActive: '#6C63FF',
      navInactive: '#555555',
      focusBorder: '#6C63FF',
      focusGlow: 'rgba(108, 99, 255, 0.5)',
      border: '#1E1E1E',
      borderLight: '#2A2A2A',
      gradientStart: '#6C63FF',
      gradientEnd: '#00D9FF',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
    borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, full: 999 },
    fontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, xxl: 24, title: 28, header: 32 },
    fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  },
  blue: {
    colors: {
      background: '#0A1628',
      surface: '#122240',
      surfaceVariant: '#152B50',
      card: '#1A3358',
      cardHover: '#1F3D6B',
      overlay: 'rgba(10, 22, 40, 0.9)',
      textPrimary: '#FFFFFF',
      textSecondary: '#8BAAC8',
      textMuted: '#4A6A8A',
      textInverse: '#0A1628',
      primary: '#2196F3',
      primaryDark: '#1976D2',
      primaryLight: '#64B5F6',
      secondary: '#00E5FF',
      accent: '#FF4081',
      success: '#00E676',
      warning: '#FFD740',
      error: '#FF5252',
      info: '#448AFF',
      playerBackground: '#000000',
      playerControls: 'rgba(10, 22, 40, 0.75)',
      playerProgress: '#2196F3',
      playerBuffer: 'rgba(33, 150, 243, 0.3)',
      epgBackground: '#081220',
      epgCurrentTime: '#FF4081',
      epgProgramActive: '#2196F3',
      epgProgramPast: '#0E1D35',
      epgProgramFuture: '#122240',
      navBackground: '#081220',
      navActive: '#2196F3',
      navInactive: '#4A6A8A',
      focusBorder: '#2196F3',
      focusGlow: 'rgba(33, 150, 243, 0.4)',
      border: '#1A3358',
      borderLight: '#204060',
      gradientStart: '#2196F3',
      gradientEnd: '#00E5FF',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
    borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, full: 999 },
    fontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, xxl: 24, title: 28, header: 32 },
    fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  },
  purple: {
    colors: {
      background: '#120B20',
      surface: '#1E1035',
      surfaceVariant: '#251545',
      card: '#2C1A50',
      cardHover: '#352060',
      overlay: 'rgba(18, 11, 32, 0.9)',
      textPrimary: '#FFFFFF',
      textSecondary: '#B8A0D8',
      textMuted: '#6A5090',
      textInverse: '#120B20',
      primary: '#BB86FC',
      primaryDark: '#9C5CDB',
      primaryLight: '#D4AAFF',
      secondary: '#03DAC6',
      accent: '#FF7597',
      success: '#00E676',
      warning: '#FFD740',
      error: '#FF5252',
      info: '#448AFF',
      playerBackground: '#000000',
      playerControls: 'rgba(18, 11, 32, 0.75)',
      playerProgress: '#BB86FC',
      playerBuffer: 'rgba(187, 134, 252, 0.3)',
      epgBackground: '#0E0818',
      epgCurrentTime: '#FF7597',
      epgProgramActive: '#BB86FC',
      epgProgramPast: '#18102A',
      epgProgramFuture: '#1E1035',
      navBackground: '#0E0818',
      navActive: '#BB86FC',
      navInactive: '#6A5090',
      focusBorder: '#BB86FC',
      focusGlow: 'rgba(187, 134, 252, 0.4)',
      border: '#2C1A50',
      borderLight: '#3A2568',
      gradientStart: '#BB86FC',
      gradientEnd: '#03DAC6',
    },
    spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
    borderRadius: { sm: 4, md: 8, lg: 12, xl: 16, full: 999 },
    fontSize: { xs: 10, sm: 12, md: 14, lg: 16, xl: 20, xxl: 24, title: 28, header: 32 },
    fontWeight: { regular: '400', medium: '500', semibold: '600', bold: '700' },
  },
};

export const getTheme = (mode: ThemeMode): Theme => themes[mode];
export default themes;
