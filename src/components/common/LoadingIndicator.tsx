import React, { useEffect } from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, withRepeat, withTiming, interpolate } from 'react-native-reanimated';
import { useTheme } from '../../utils/theme';
import { useLoadingAnimation, usePulseAnimation } from '../../utils/animations';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

interface LoadingIndicatorProps {
  size?: 'small' | 'large';
  color?: string;
  message?: string;
  style?: ViewStyle;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  size = 'large',
  color,
  message,
  style,
}) => {
  const { colors } = useTheme();
  const { animatedStyle: loadingStyle, startLoading } = useLoadingAnimation(1500);
  const { animatedStyle: pulseStyle, startPulse } = usePulseAnimation(1.1, 2000);

  useEffect(() => {
    startLoading();
    startPulse();
  }, [startLoading, startPulse]);

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[styles.indicatorWrapper, pulseStyle]}>
        <Animated.View style={loadingStyle}>
          <ActivityIndicator
            size={size}
            color={color || colors.primary}
          />
        </Animated.View>
      </Animated.View>
      {message && (
        <Animated.Text
          style={[
            styles.message,
            { color: colors.onBackground },
            pulseStyle,
          ]}
        >
          {message}
        </Animated.Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  indicatorWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    ...TYPOGRAPHY.body2,
    marginTop: SPACING.md,
    textAlign: 'center',
  },
});
