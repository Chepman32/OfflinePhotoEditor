import React, { createContext, useContext, useState, ReactNode } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { COLORS, ColorScheme, ThemeColors } from '../constants/colors';

interface ThemeContextType {
  theme: ColorScheme;
  colors: ThemeColors;
  toggleTheme: () => void;
  isTransitioning: { value: boolean };
  themeProgress: { value: number };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ColorScheme>('light');
  // Temporarily disable Reanimated until worklet issue is resolved
  // const isTransitioning = useSharedValue(false);
  // const themeProgress = useSharedValue(0);

  const colors = COLORS[theme];

  const toggleTheme = () => {
    // Temporarily simplified without Reanimated animations
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      colors,
      toggleTheme,
      isTransitioning: { value: false }, // Temporary mock
      themeProgress: { value: 0 } // Temporary mock
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Hook for theme transition animations
export const useThemeTransition = () => {
  const { isTransitioning, themeProgress } = useTheme();

  // Temporarily return mock styles without Reanimated
  const themeTransitionStyle = { opacity: 1 };
  const circularRevealStyle = { opacity: 1, transform: [{ scale: 1 }] };

  return {
    themeTransitionStyle,
    circularRevealStyle,
    isTransitioning,
    themeProgress,
  };
};
