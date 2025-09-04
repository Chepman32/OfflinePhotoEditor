import { AccessibilityInfo, Platform } from 'react-native';
import { useEffect, useState } from 'react';

export interface AccessibilityState {
  screenReaderEnabled: boolean;
  reduceMotionEnabled: boolean;
  highContrastEnabled: boolean;
}

export const useAccessibility = (): AccessibilityState => {
  const [screenReaderEnabled, setScreenReaderEnabled] = useState(false);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);
  const [highContrastEnabled, setHighContrastEnabled] = useState(false);

  useEffect(() => {
    const checkAccessibility = async () => {
      try {
        const screenReader = await AccessibilityInfo.isScreenReaderEnabled();
        setScreenReaderEnabled(screenReader);

        const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled();
        setReduceMotionEnabled(reduceMotion);

        // High contrast detection (limited platform support)
        if (Platform.OS === 'ios') {
          // iOS high contrast detection
          setHighContrastEnabled(false); // Placeholder - would need native module
        }
      } catch (error) {
        console.warn('Accessibility check failed:', error);
      }
    };

    checkAccessibility();

    // Listen for changes
    const screenReaderSubscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      setScreenReaderEnabled
    );

    const reduceMotionSubscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotionEnabled
    );

    return () => {
      screenReaderSubscription?.remove();
      reduceMotionSubscription?.remove();
    };
  }, []);

  return {
    screenReaderEnabled,
    reduceMotionEnabled,
    highContrastEnabled,
  };
};

// Accessibility helper functions
export const getAccessibilityProps = (
  label: string,
  hint?: string,
  role?: 'button' | 'header' | 'image' | 'text' | 'adjustable',
  state?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean;
    expanded?: boolean;
  }
) => {
  const baseProps: any = {
    accessible: true,
    accessibilityLabel: label,
    accessibilityRole: role,
  };

  if (hint) {
    baseProps.accessibilityHint = hint;
  }

  if (state) {
    if (state.disabled !== undefined) {
      baseProps.accessibilityState = {
        ...baseProps.accessibilityState,
        disabled: state.disabled,
      };
    }
    if (state.selected !== undefined) {
      baseProps.accessibilityState = {
        ...baseProps.accessibilityState,
        selected: state.selected,
      };
    }
    if (state.checked !== undefined) {
      baseProps.accessibilityState = {
        ...baseProps.accessibilityState,
        checked: state.checked,
      };
    }
    if (state.expanded !== undefined) {
      baseProps.accessibilityState = {
        ...baseProps.accessibilityState,
        expanded: state.expanded,
      };
    }
  }

  return baseProps;
};

// Haptic feedback helper
export const triggerHapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  try {
    const ReactNativeHapticFeedback = require('react-native-haptic-feedback').default;

    const hapticTypes = {
      light: 'impactLight',
      medium: 'impactMedium',
      heavy: 'impactHeavy',
    };

    const options = {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    };

    ReactNativeHapticFeedback.trigger(hapticTypes[type], options);
  } catch (error) {
    // Fallback for when library is not available
    console.warn('Haptic feedback not available:', error);
  }
};

// Dynamic font scaling helper
export const getScaledFontSize = (baseSize: number, scale?: number): number => {
  if (!scale) return baseSize;
  return Math.max(baseSize * scale, baseSize * 0.8); // Minimum 80% of base size
};

// Announcement helper for screen readers
export const announceForAccessibility = (message: string) => {
  AccessibilityInfo.announceForAccessibility(message);
};

// Focus management helper
export const setAccessibilityFocus = (ref: any) => {
  if (ref?.current) {
    AccessibilityInfo.setAccessibilityFocus(ref.current);
  }
};
