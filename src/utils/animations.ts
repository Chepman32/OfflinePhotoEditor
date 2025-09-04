import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  interpolate,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useAccessibility } from './accessibility';

// Animation presets for consistent timing and easing
export const ANIMATION_CONFIG = {
  spring: {
    damping: 20,
    stiffness: 100,
    mass: 1,
  },
  springBouncy: {
    damping: 12,
    stiffness: 150,
    mass: 0.8,
  },
  springGentle: {
    damping: 25,
    stiffness: 80,
    mass: 1.2,
  },
  timing: {
    duration: 300,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  timingSlow: {
    duration: 500,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
  timingFast: {
    duration: 150,
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  },
} as const;

// Stagger animation utility
export const createStaggerAnimation = (
  items: number,
  delay: number = 100,
  config = ANIMATION_CONFIG.spring
) => {
  const { reduceMotionEnabled } = useAccessibility();

  return Array.from({ length: items }, (_, index) => {
    const animation = useSharedValue(0);
    const animatedStyle = useAnimatedStyle(() => ({
      opacity: animation.value,
      transform: [
        {
          translateY: interpolate(animation.value, [0, 1], [20, 0]),
        },
        {
          scale: interpolate(animation.value, [0, 1], [0.9, 1]),
        },
      ],
    }));

    const startAnimation = () => {
      if (reduceMotionEnabled) {
        animation.value = 1;
      } else {
        animation.value = withDelay(
          index * delay,
          withSpring(1, config)
        );
      }
    };

    return { animation, animatedStyle, startAnimation };
  });
};

// Pulse animation hook
export const usePulseAnimation = (intensity: number = 1.1, duration: number = 1000) => {
  const { reduceMotionEnabled } = useAccessibility();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const startPulse = () => {
    if (reduceMotionEnabled) return;

    scale.value = withRepeat(
      withSequence(
        withTiming(intensity, { duration: duration / 4 }),
        withTiming(1, { duration: duration / 4 })
      ),
      -1, // Infinite repeat
      true // Reverse animation
    );
  };

  const stopPulse = () => {
    scale.value = withTiming(1, { duration: 200 });
  };

  return { animatedStyle, startPulse, stopPulse };
};

// Bounce animation hook
export const useBounceAnimation = (bounceHeight: number = -10) => {
  const { reduceMotionEnabled } = useAccessibility();
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const bounce = () => {
    if (reduceMotionEnabled) return;

    translateY.value = withSequence(
      withSpring(bounceHeight, { damping: 8, stiffness: 300 }),
      withSpring(0, { damping: 12, stiffness: 200 })
    );
  };

  return { animatedStyle, bounce };
};

// Shake animation hook
export const useShakeAnimation = (intensity: number = 5) => {
  const { reduceMotionEnabled } = useAccessibility();
  const translateX = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const shake = () => {
    if (reduceMotionEnabled) return;

    translateX.value = withSequence(
      withTiming(-intensity, { duration: 50 }),
      withTiming(intensity, { duration: 50 }),
      withTiming(-intensity, { duration: 50 }),
      withTiming(intensity, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  return { animatedStyle, shake };
};

// Fade in animation hook
export const useFadeInAnimation = (
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  distance: number = 20,
  config = ANIMATION_CONFIG.timing
) => {
  const { reduceMotionEnabled } = useAccessibility();
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Set initial translation based on direction
  switch (direction) {
    case 'up':
      translateY.value = distance;
      break;
    case 'down':
      translateY.value = -distance;
      break;
    case 'left':
      translateX.value = distance;
      break;
    case 'right':
      translateX.value = -distance;
      break;
  }

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  const fadeIn = () => {
    if (reduceMotionEnabled) {
      opacity.value = 1;
      translateX.value = 0;
      translateY.value = 0;
    } else {
      opacity.value = withTiming(1, config);
      translateX.value = withTiming(0, config);
      translateY.value = withTiming(0, config);
    }
  };

  const fadeOut = () => {
    if (reduceMotionEnabled) {
      opacity.value = 0;
    } else {
      opacity.value = withTiming(0, config);
    }
  };

  return { animatedStyle, fadeIn, fadeOut };
};

// Scale animation hook
export const useScaleAnimation = (
  initialScale: number = 0,
  targetScale: number = 1,
  config = ANIMATION_CONFIG.spring
) => {
  const { reduceMotionEnabled } = useAccessibility();
  const scale = useSharedValue(initialScale);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animateToScale = (newScale: number = targetScale) => {
    if (reduceMotionEnabled) {
      scale.value = newScale;
    } else {
      scale.value = withSpring(newScale, config);
    }
  };

  const resetScale = () => {
    if (reduceMotionEnabled) {
      scale.value = initialScale;
    } else {
      scale.value = withSpring(initialScale, config);
    }
  };

  return { animatedStyle, animateToScale, resetScale, scale };
};

// Ripple effect animation
export const useRippleAnimation = (maxScale: number = 2) => {
  const { reduceMotionEnabled } = useAccessibility();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const ripple = (callback?: () => void) => {
    if (reduceMotionEnabled) {
      callback?.();
      return;
    }

    scale.value = withSequence(
      withTiming(maxScale, { duration: 300 }),
      withTiming(1, { duration: 200 })
    );

    opacity.value = withSequence(
      withTiming(0.3, { duration: 300 }),
      withTiming(0, { duration: 200 })
    );

    if (callback) {
      runOnJS(callback)();
    }
  };

  return { animatedStyle, ripple };
};

// Loading spinner animation
export const useLoadingAnimation = (speed: number = 1000) => {
  const { reduceMotionEnabled } = useAccessibility();
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const startLoading = () => {
    if (reduceMotionEnabled) return;

    rotation.value = withRepeat(
      withTiming(360, { duration: speed }),
      -1,
      false
    );
  };

  const stopLoading = () => {
    rotation.value = withTiming(0, { duration: 200 });
  };

  return { animatedStyle, startLoading, stopLoading };
};

// Heartbeat animation (for attention-grabbing elements)
export const useHeartbeatAnimation = (
  minScale: number = 0.95,
  maxScale: number = 1.05,
  speed: number = 1000
) => {
  const { reduceMotionEnabled } = useAccessibility();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const startHeartbeat = () => {
    if (reduceMotionEnabled) return;

    scale.value = withRepeat(
      withSequence(
        withTiming(maxScale, { duration: speed / 4 }),
        withTiming(minScale, { duration: speed / 4 }),
        withTiming(maxScale, { duration: speed / 4 }),
        withTiming(1, { duration: speed / 4 })
      ),
      -1,
      false
    );
  };

  const stopHeartbeat = () => {
    scale.value = withTiming(1, { duration: 200 });
  };

  return { animatedStyle, startHeartbeat, stopHeartbeat };
};

// Wave animation for lists
export const useWaveAnimation = (items: number, waveDelay: number = 100) => {
  const { reduceMotionEnabled } = useAccessibility();

  return Array.from({ length: items }, (_, index) => {
    const translateY = useSharedValue(0);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateY: translateY.value }],
      opacity: opacity.value,
    }));

    const wave = () => {
      if (reduceMotionEnabled) return;

      translateY.value = withDelay(
        index * waveDelay,
        withSequence(
          withTiming(-10, { duration: 150 }),
          withTiming(0, { duration: 150 })
        )
      );

      opacity.value = withDelay(
        index * waveDelay,
        withSequence(
          withTiming(0.7, { duration: 150 }),
          withTiming(1, { duration: 150 })
        )
      );
    };

    return { animatedStyle, wave };
  });
};

// Morphing shape animation
export const useMorphAnimation = (
  initialShape: 'circle' | 'square' | 'rectangle',
  targetShape: 'circle' | 'square' | 'rectangle'
) => {
  const { reduceMotionEnabled } = useAccessibility();
  const borderRadius = useSharedValue(0);
  const aspectRatio = useSharedValue(1);

  // Set initial values based on shape
  switch (initialShape) {
    case 'circle':
      borderRadius.value = 50;
      aspectRatio.value = 1;
      break;
    case 'square':
      borderRadius.value = 0;
      aspectRatio.value = 1;
      break;
    case 'rectangle':
      borderRadius.value = 0;
      aspectRatio.value = 2;
      break;
  }

  const animatedStyle = useAnimatedStyle(() => ({
    borderRadius: borderRadius.value,
    aspectRatio: aspectRatio.value,
  }));

  const morph = () => {
    if (reduceMotionEnabled) {
      switch (targetShape) {
        case 'circle':
          borderRadius.value = 50;
          aspectRatio.value = 1;
          break;
        case 'square':
          borderRadius.value = 0;
          aspectRatio.value = 1;
          break;
        case 'rectangle':
          borderRadius.value = 0;
          aspectRatio.value = 2;
          break;
      }
      return;
    }

    switch (targetShape) {
      case 'circle':
        borderRadius.value = withTiming(50, { duration: 300 });
        aspectRatio.value = withTiming(1, { duration: 300 });
        break;
      case 'square':
        borderRadius.value = withTiming(0, { duration: 300 });
        aspectRatio.value = withTiming(1, { duration: 300 });
        break;
      case 'rectangle':
        borderRadius.value = withTiming(0, { duration: 300 });
        aspectRatio.value = withTiming(2, { duration: 300 });
        break;
    }
  };

  return { animatedStyle, morph };
};

// Combined animation presets
export const ANIMATION_PRESETS = {
  // Screen transitions
  screenEnter: (direction: 'left' | 'right' | 'up' | 'down' = 'right') => ({
    initial: {
      opacity: 0,
      translateX: direction === 'left' ? -50 : direction === 'right' ? 50 : 0,
      translateY: direction === 'up' ? -50 : direction === 'down' ? 50 : 0,
    },
    animate: {
      opacity: 1,
      translateX: 0,
      translateY: 0,
    },
    config: ANIMATION_CONFIG.spring,
  }),

  // Button interactions
  buttonPress: {
    initial: { scale: 1 },
    pressed: { scale: 0.95 },
    config: ANIMATION_CONFIG.spring,
  },

  // Loading states
  skeletonPulse: {
    initial: { opacity: 0.5 },
    animate: { opacity: 1 },
    config: { duration: 1000, easing: Easing.bezier(0.4, 0, 0.6, 1) },
  },

  // Success feedback
  successBounce: {
    initial: { scale: 0 },
    animate: { scale: 1 },
    config: ANIMATION_CONFIG.springBouncy,
  },

  // Error feedback
  errorShake: {
    initial: { translateX: 0 },
    animate: [
      { translateX: -5 },
      { translateX: 5 },
      { translateX: -5 },
      { translateX: 5 },
      { translateX: 0 },
    ],
    config: { duration: 500 },
  },

  // Attention grabbers
  attentionPulse: {
    initial: { scale: 1 },
    animate: { scale: 1.1 },
    config: { duration: 500, easing: Easing.bezier(0.68, -0.55, 0.265, 1.55) },
  },
} as const;

// Utility function to check if animations should be disabled
export const shouldDisableAnimations = () => {
  const { reduceMotionEnabled } = useAccessibility();
  return reduceMotionEnabled;
};

// Performance monitoring for animations
export const createAnimationMonitor = () => {
  const startTime = useSharedValue(0);
  const frameCount = useSharedValue(0);

  const startMonitoring = () => {
    startTime.value = Date.now();
    frameCount.value = 0;
  };

  const frameCallback = () => {
    'worklet';
    frameCount.value += 1;
  };

  const getPerformanceMetrics = () => {
    const duration = Date.now() - startTime.value;
    const fps = (frameCount.value / duration) * 1000;
    return { fps, frameCount: frameCount.value, duration };
  };

  return {
    startMonitoring,
    frameCallback,
    getPerformanceMetrics,
  };
};
