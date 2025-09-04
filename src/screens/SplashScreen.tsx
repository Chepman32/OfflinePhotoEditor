import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
// Temporarily disabled Reanimated due to worklet issues
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withTiming,
//   withSpring,
//   withSequence,
//   withDelay,
//   runOnJS,
// } from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../utils/theme';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING } from '../constants/spacing';
import { RootStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get('window');

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const { colors } = useTheme();

  // Temporarily disabled animations due to Reanimated worklet issues
  // Animation values
  // const logoOpacity = useSharedValue(0);
  // const logoScale = useSharedValue(0.8);
  // const logoRotation = useSharedValue(0);
  // const appNameTranslateY = useSharedValue(50);
  // const appNameOpacity = useSharedValue(0);
  // const screenScale = useSharedValue(1);
  // const screenOpacity = useSharedValue(1);

  const navigateToMain = () => {
    navigation.replace('Main');
  };

  useEffect(() => {
    // Temporarily simplified: just wait and navigate
    const timer = setTimeout(() => {
      navigateToMain();
    }, 3000); // Navigate after 3 seconds

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={[colors.primary, colors.primaryVariant]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Text style={styles.logoText}>📷</Text>
            </View>
          </View>

          {/* App Name */}
          <View style={styles.appNameContainer}>
            <Text style={[styles.appName, { color: '#FFFFFF' }]}>
              OfflinePhotoEditor
            </Text>
          </View>

          {/* Loading Indicator */}
          <View style={styles.loadingContainer}>
            <View style={[styles.loadingBar, { backgroundColor: '#FFFFFF' }]} />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  logoContainer: {
    marginBottom: SPACING.xl,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logoText: {
    fontSize: 48,
  },
  appNameContainer: {
    marginBottom: SPACING.xxl,
  },
  appName: {
    ...TYPOGRAPHY.headline1,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: SPACING.xxl,
    width: width * 0.6,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 1,
  },
  loadingBar: {
    height: '100%',
    width: '100%',
    borderRadius: 1,
  },
});
