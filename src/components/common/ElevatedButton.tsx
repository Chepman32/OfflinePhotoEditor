import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/theme';
import { getAccessibilityProps, triggerHapticFeedback, useAccessibility } from '../../utils/accessibility';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ElevatedButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

const BUTTON_HEIGHT = 48;
const CORNER_RADIUS = 24;
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

export const ElevatedButton: React.FC<ElevatedButtonProps> = ({
  title,
  onPress,
  disabled = false,
  style,
  textStyle,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { colors } = useTheme();
  const { reduceMotionEnabled } = useAccessibility();
  const scale = useSharedValue(1);
  const elevation = useSharedValue(2);

  const handlePressIn = () => {
    if (!reduceMotionEnabled) {
      scale.value = withSpring(0.95, SPRING_CONFIG);
      elevation.value = withSpring(8, SPRING_CONFIG);
    }
    triggerHapticFeedback('light');
  };

  const handlePressOut = () => {
    if (!reduceMotionEnabled) {
      scale.value = withSpring(1, SPRING_CONFIG);
      elevation.value = withSpring(2, SPRING_CONFIG);
    }
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    elevation: elevation.value,
    shadowOpacity: elevation.value / 10,
  }));

  const accessibilityProps = getAccessibilityProps(
    accessibilityLabel || title,
    accessibilityHint || `Tap to ${title.toLowerCase()}`,
    'button',
    { disabled }
  );

  return (
    <AnimatedTouchable
      style={[
        styles.container,
        {
          backgroundColor: colors.primary,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: elevation.value / 2 },
              shadowOpacity: elevation.value / 10,
              shadowRadius: elevation.value / 2,
            },
          }),
        },
        animatedStyle,
        style,
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={1}
      {...accessibilityProps}
    >
      <Text
        style={[
          styles.text,
          { color: colors.onPrimary },
          textStyle,
        ]}
        accessibilityRole="text"
      >
        {title}
      </Text>
    </AnimatedTouchable>
  );
};

const styles = StyleSheet.create({
  container: {
    height: BUTTON_HEIGHT,
    borderRadius: CORNER_RADIUS,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    minWidth: 120,
  },
  text: {
    ...TYPOGRAPHY.button,
  },
});
