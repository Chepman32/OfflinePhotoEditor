import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/theme';
import { getAccessibilityProps, triggerHapticFeedback, useAccessibility, announceForAccessibility } from '../../utils/accessibility';

const { width, height } = Dimensions.get('window');

interface ThemeToggleProps {
  size?: number;
  style?: any;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 48,
  style,
}) => {
  const { theme, toggleTheme, isTransitioning, themeProgress } = useTheme();
  const { reduceMotionEnabled } = useAccessibility();
  const iconRotation = useSharedValue(0);
  const revealScale = useSharedValue(0);
  const revealOpacity = useSharedValue(0);

  const handleToggle = () => {
    if (isTransitioning.value) return;

    // Announce theme change for accessibility
    const newTheme = theme === 'light' ? 'dark' : 'light';
    announceForAccessibility(`Switching to ${newTheme} theme`);

    if (!reduceMotionEnabled) {
      // Start circular reveal animation
      revealScale.value = withTiming(1, { duration: 200 });
      revealOpacity.value = withTiming(0.3, { duration: 200 });

      // Icon rotation animation
      iconRotation.value = withSpring(
        theme === 'light' ? 180 : 0,
        { damping: 15, stiffness: 100 }
      );
    }

    // Haptic feedback
    triggerHapticFeedback('medium');

    // Call the actual theme toggle
    toggleTheme();

    // Reset reveal after animation
    if (!reduceMotionEnabled) {
      setTimeout(() => {
        revealScale.value = withTiming(0, { duration: 200 });
        revealOpacity.value = withTiming(0, { duration: 200 });
      }, 400);
    }
  };

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale: interpolate(
          themeProgress.value,
          [0, 0.5, 1],
          [1, 1.05, 1]
        ),
      },
    ],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(
          themeProgress.value,
          [0, 1],
          [0, 180]
        )}deg`,
      },
      {
        scale: interpolate(
          themeProgress.value,
          [0, 0.5, 1],
          [1, 0.9, 1]
        ),
      },
    ],
  }));

  const revealAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: revealScale.value }],
    opacity: revealOpacity.value,
  }));

  const accessibilityProps = getAccessibilityProps(
    `Theme toggle, currently ${theme}`,
    `Double tap to switch to ${theme === 'light' ? 'dark' : 'light'} theme`,
    'button'
  );

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, containerAnimatedStyle, style]}>
      <TouchableOpacity
        style={[styles.button, { width: size, height: size }]}
        onPress={handleToggle}
        activeOpacity={0.8}
        {...accessibilityProps}
      >
        {/* Circular reveal background */}
        <Animated.View
          style={[
            styles.revealBackground,
            {
              backgroundColor: theme === 'light' ? '#121212' : '#FFFFFF',
              width: size * 2,
              height: size * 2,
              borderRadius: size,
            },
            revealAnimatedStyle,
          ]}
        />

        {/* Theme icon */}
        <Animated.Text
          style={[
            styles.icon,
            iconAnimatedStyle,
          ]}
        >
          {theme === 'light' ? '☀️' : '🌙'}
        </Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  revealBackground: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [
      { translateX: '-50%' },
      { translateY: '-50%' },
    ],
  },
  icon: {
    fontSize: 20,
    zIndex: 1,
  },
});
