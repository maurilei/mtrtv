// ============================================================
// MtrTV - TV Focusable Component
// Handles D-pad navigation focus for Android TV / FireTV
// ============================================================

import React, { useRef, useCallback, useState } from 'react';
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
  Animated,
  Platform,
  TVFocusGuideView,
  findNodeHandle,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { getTheme } from '../theme';

interface FocusableProps {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
  style?: ViewStyle;
  focusStyle?: ViewStyle;
  hasTVPreferredFocus?: boolean;
  nextFocusUp?: number;
  nextFocusDown?: number;
  nextFocusLeft?: number;
  nextFocusRight?: number;
  disabled?: boolean;
  isTVSelectable?: boolean;
  testID?: string;
  focusBorderColor?: string;
  showFocusBorder?: boolean;
  scaleOnFocus?: boolean;
}

export const Focusable: React.FC<FocusableProps> = ({
  children,
  onPress,
  onLongPress,
  onFocus,
  onBlur,
  style,
  focusStyle,
  hasTVPreferredFocus = false,
  nextFocusUp,
  nextFocusDown,
  nextFocusLeft,
  nextFocusRight,
  disabled = false,
  isTVSelectable = true,
  testID,
  focusBorderColor,
  showFocusBorder = true,
  scaleOnFocus = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { appSettings } = useAppStore();
  const theme = getTheme(appSettings.theme);

  const borderColor = focusBorderColor || theme.colors.focusBorder;

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    if (scaleOnFocus && appSettings.animationsEnabled) {
      Animated.spring(scaleAnim, {
        toValue: 1.05,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
    onFocus?.();
  }, [scaleAnim, scaleOnFocus, appSettings.animationsEnabled, onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    if (scaleOnFocus && appSettings.animationsEnabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
    onBlur?.();
  }, [scaleAnim, scaleOnFocus, appSettings.animationsEnabled, onBlur]);

  const focusedStyle: ViewStyle = isFocused && showFocusBorder
    ? {
        borderWidth: 2,
        borderColor: borderColor,
        shadowColor: borderColor,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 8,
      }
    : {
        borderWidth: 2,
        borderColor: 'transparent',
      };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onPress}
        onLongPress={onLongPress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        hasTVPreferredFocus={hasTVPreferredFocus}
        nextFocusUp={nextFocusUp}
        nextFocusDown={nextFocusDown}
        nextFocusLeft={nextFocusLeft}
        nextFocusRight={nextFocusRight}
        disabled={disabled}
        isTVSelectable={isTVSelectable}
        testID={testID}
        style={[style, focusedStyle, isFocused && focusStyle]}
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ============================================================
// Focusable Row - Horizontal scrollable focus container
// ============================================================

interface FocusableRowProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const FocusableRow: React.FC<FocusableRowProps> = ({ children, style }) => {
  return (
    <View style={[styles.row, style]}>
      {children}
    </View>
  );
};

// ============================================================
// Focus Group - Groups focusable elements for navigation
// ============================================================

interface FocusGroupProps {
  children: React.ReactNode;
  style?: ViewStyle;
  autoFocus?: boolean;
}

export const FocusGroup: React.FC<FocusGroupProps> = ({
  children,
  style,
  autoFocus = false,
}) => {
  return (
    <View style={style}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default Focusable;
