import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Platform,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/theme';
import { SPACING } from '../../constants/spacing';

const AnimatedView = Animated.createAnimatedComponent(View);

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevation?: number;
}

const CORNER_RADIUS = 12;
const SPRING_CONFIG = {
  damping: 20,
  stiffness: 100,
  mass: 1,
};

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  elevation = 4,
}) => {
  const { colors } = useTheme();
  const cardElevation = useSharedValue(elevation);

  const animatedStyle = useAnimatedStyle(() => ({
    elevation: cardElevation.value,
    shadowOpacity: interpolate(cardElevation.value, [0, 16], [0, 0.3]),
    transform: [{ translateY: interpolate(cardElevation.value, [0, 16], [0, -2]) }],
  }));

  const handlePressIn = () => {
    if (onPress) {
      cardElevation.value = withSpring(elevation + 4, SPRING_CONFIG);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      cardElevation.value = withSpring(elevation, SPRING_CONFIG);
    }
  };

  const cardContent = (
    <AnimatedView
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          ...Platform.select({
            ios: {
              shadowColor: '#000',
              shadowOffset: { width: 0, height: cardElevation.value / 2 },
              shadowOpacity: interpolate(cardElevation.value, [0, 16], [0, 0.3]),
              shadowRadius: cardElevation.value / 2,
            },
          }),
        },
        animatedStyle,
        style,
      ]}
    >
      {children}
    </AnimatedView>
  );

  if (onPress) {
    const AnimatedTouchable = Animated.createAnimatedComponent(require('react-native').TouchableOpacity);
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        {cardContent}
      </AnimatedTouchable>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  container: {
    borderRadius: CORNER_RADIUS,
    padding: SPACING.md,
  },
});
