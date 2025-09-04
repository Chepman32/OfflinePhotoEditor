import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
// Temporarily disabled Reanimated due to worklet issues
// import Animated, {
//   useSharedValue,
//   useAnimatedStyle,
//   withSpring,
//   withTiming,
//   withSequence,
//   interpolate,
//   runOnJS,
// } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootStackParamList } from '../navigation/types';
import { RootState } from '../store';
import { useTheme } from '../utils/theme';
import { useErrorHandler } from '../utils/errorHandler';
import { iapService } from '../services/iapService';
import { useUserPreferences } from '../hooks/useStorage';
import { IconButton } from '../components/common/IconButton';
import { ElevatedButton } from '../components/common/ElevatedButton';
import { Card } from '../components/common/Card';
import { Toolbar } from '../components/common/Toolbar';
import { LoadingIndicator } from '../components/common/LoadingIndicator';
import { TYPOGRAPHY } from '../constants/typography';
import { SPACING } from '../constants/spacing';

const { width } = Dimensions.get('window');

type PremiumScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Premium'
>;

interface SubscriptionPlan {
  id: 'monthly' | 'yearly' | 'lifetime';
  title: string;
  price: string;
  originalPrice?: string;
  period: string;
  savings?: string;
  popular?: boolean;
  features: string[];
}

const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    title: 'Monthly',
    price: '$4.99',
    period: '/month',
    features: [
      '10 premium filters',
      '5 premium fonts',
      'Basic blur tools',
      'No watermarks',
    ],
  },
  {
    id: 'yearly',
    title: 'Yearly',
    price: '$39.99',
    originalPrice: '$59.88',
    period: '/year',
    savings: 'Save 33%',
    popular: true,
    features: [
      '25+ premium filters',
      '20+ premium fonts',
      'Advanced blur tools',
      'Magic eraser',
      'Priority processing',
    ],
  },
  {
    id: 'lifetime',
    title: 'Lifetime',
    price: '$99.99',
    period: ' one-time',
    features: [
      'All premium features',
      'Lifetime updates',
      'Exclusive content',
      'Early access to new features',
      'Priority support',
    ],
  },
];

const PREMIUM_FEATURES = [
  '🎨 25+ Advanced Filters',
  '✍️ 20+ Premium Fonts',
  '🌫️ Advanced Blur Tools',
  '🧽 Magic Eraser',
  '📐 Social Media Templates',
  '🎯 Sticker Library',
  '⚡ Priority Processing',
  '🚫 No Watermarks',
];

export const PremiumScreen: React.FC = () => {
  const navigation = useNavigation<PremiumScreenNavigationProp>();
  const { colors } = useTheme();
  const { handleError } = useErrorHandler();
  const { incrementStat } = useUserPreferences();
  const isPremium = useSelector(
    (state: RootState) => state.subscription.isPremium,
  );
  const subscription = useSelector((state: RootState) => state.subscription);

  const [selectedPlan, setSelectedPlan] = useState<string>('yearly');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Temporarily disabled animations due to Reanimated worklet issues
  // Animation values
  // const headerTranslateY = useSharedValue(-100);
  // const heroOpacity = useSharedValue(0);
  // const heroTranslateY = useSharedValue(50);
  // const benefitsOpacity = useSharedValue(0);
  // const plansOpacity = useSharedValue(0);
  // const plansTranslateY = useSharedValue(30);
  // const selectedPlanScale = useSharedValue(1);
  // const successScale = useSharedValue(0);
  // const successOpacity = useSharedValue(0);

  useEffect(() => {
    // Temporarily disabled animations
    // startAnimations();
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const availableProducts = await iapService.getProducts();
      setProducts(availableProducts);
    } catch (error) {
      handleError(error, { context: 'loadProducts' });
    } finally {
      setLoadingProducts(false);
    }
  };

  // const startAnimations = () => {
  //   // Header animation
  //   headerTranslateY.value = withSpring(0, {
  //     damping: 15,
  //     stiffness: 100,
  //   });

  //   // Hero animation
  //   setTimeout(() => {
  //     heroOpacity.value = withTiming(1, { duration: 600 });
  //     heroTranslateY.value = withSpring(0, {
  //       damping: 20,
  //       stiffness: 100,
  //     });
  //   }, 200);

  //   // Benefits animation
  //   setTimeout(() => {
  //     benefitsOpacity.value = withTiming(1, { duration: 500 });
  //   }, 400);

  //   // Plans animation
  //   setTimeout(() => {
  //     plansOpacity.value = withTiming(1, { duration: 600 });
  //     plansTranslateY.value = withSpring(0, {
  //       damping: 20,
  //       stiffness: 100,
  //     });
  //   }, 600);
  // };

  // const headerAnimatedStyle = useAnimatedStyle(() => ({
  //   transform: [{ translateY: headerTranslateY.value }],
  // }));

  // const heroAnimatedStyle = useAnimatedStyle(() => ({
  //   opacity: heroOpacity.value,
  //   transform: [{ translateY: heroTranslateY.value }],
  // }));

  // const benefitsAnimatedStyle = useAnimatedStyle(() => ({
  //   opacity: benefitsOpacity.value,
  // }));

  // const plansAnimatedStyle = useAnimatedStyle(() => ({
  //   opacity: plansOpacity.value,
  //   transform: [{ translateY: plansTranslateY.value }],
  // }));

  // const selectedPlanAnimatedStyle = useAnimatedStyle(() => ({
  //   transform: [{ scale: selectedPlanScale.value }],
  // }));

  // const successAnimatedStyle = useAnimatedStyle(() => ({
  //   opacity: successOpacity.value,
  //   transform: [{ scale: successScale.value }],
  // }));

  const handleBack = () => {
    navigation.goBack();
  };

  const handlePlanSelect = (planId: string) => {
    setSelectedPlan(planId);
    // Animation temporarily disabled
    // selectedPlanScale.value = withSequence(
    //   withSpring(1.05, { damping: 10, stiffness: 200 }),
    //   withSpring(1, { damping: 15, stiffness: 150 })
    // );
  };

  const handlePurchase = async (planId: string) => {
    try {
      setIsPurchasing(true);

      // Get the product ID for the selected plan
      const productId = getProductIdForPlan(planId);
      if (!productId) {
        throw new Error('Invalid plan selected');
      }

      // Perform the purchase
      const purchase = await iapService.purchaseProduct(productId);

      // Update subscription state
      // This would normally be handled by the IAP library and Redux
      console.log('Purchase completed:', purchase);

      // Track the purchase
      await incrementStat('totalExports'); // Using totalExports as a proxy for purchases

      showSuccessAnimation();
    } catch (error) {
      handleError(error, { context: 'purchase', planId });
    } finally {
      setIsPurchasing(false);
    }
  };

  const getProductIdForPlan = (planId: string): string | null => {
    const productMap: { [key: string]: string } = {
      monthly: 'com.offlinephotoeditor.monthly',
      yearly: 'com.offlinephotoeditor.yearly',
      lifetime: 'com.offlinephotoeditor.lifetime',
    };
    return productMap[planId] || null;
  };

  const handleRestorePurchases = async () => {
    try {
      setIsPurchasing(true);
      const restoredPurchases = await iapService.restorePurchases();

      if (restoredPurchases.length > 0) {
        Alert.alert(
          'Purchases Restored',
          `Successfully restored ${restoredPurchases.length} purchase(s).`,
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert(
          'No Purchases Found',
          'No previous purchases were found to restore.',
          [{ text: 'OK' }],
        );
      }
    } catch (error) {
      handleError(error, { context: 'restorePurchases' });
      Alert.alert(
        'Restore Failed',
        'Failed to restore purchases. Please try again.',
        [{ text: 'OK' }],
      );
    } finally {
      setIsPurchasing(false);
    }
  };

  const showSuccessAnimation = () => {
    // Animation temporarily disabled
    // successOpacity.value = withTiming(1, { duration: 300 });
    // successScale.value = withSpring(1, {
    //   damping: 12,
    //   stiffness: 150,
    //   mass: 1,
    // });

    setTimeout(() => {
      navigation.goBack();
    }, 2000);
  };

  const renderBenefitItem = (benefit: string, index: number) => {
    const delay = index * 100;
    // Temporarily disabled animations
    // const animatedStyle = useAnimatedStyle(() => ({
    //   opacity: interpolate(
    //     benefitsOpacity.value,
    //     [0, 1],
    //     [0, 1]
    //   ),
    //   transform: [
    //     {
    //       translateY: interpolate(
    //         benefitsOpacity.value,
    //         [0, 1],
    //         [20, 0]
    //       ),
    //     },
    //   ],
    // }));

    return (
      <View
        key={index}
        style={[styles.benefitItem, { backgroundColor: colors.surface }]}
      >
        <Text style={[styles.benefitText, { color: colors.onBackground }]}>
          {benefit}
        </Text>
      </View>
    );
  };

  const renderSubscriptionPlan = (plan: SubscriptionPlan) => {
    const isSelected = selectedPlan === plan.id;
    // Temporarily disabled animations due to Reanimated worklet issues

    return (
      <TouchableOpacity
        key={plan.id}
        style={styles.planTouchable}
        onPress={() => handlePlanSelect(plan.id)}
        activeOpacity={0.9}
      >
        <View
          style={[
            styles.planCard,
            isSelected && styles.planCardSelected,
            { backgroundColor: colors.surface },
          ]}
        >
          {plan.popular && (
            <View
              style={[styles.popularBadge, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.popularText, { color: colors.onPrimary }]}>
                Most Popular
              </Text>
            </View>
          )}

          <View style={styles.planHeader}>
            <Text style={[styles.planTitle, { color: colors.onBackground }]}>
              {plan.title}
            </Text>
            <View style={styles.planPrice}>
              <Text style={[styles.planPriceAmount, { color: colors.primary }]}>
                {plan.price}
              </Text>
              <Text
                style={[styles.planPricePeriod, { color: colors.onSurface }]}
              >
                {plan.period}
              </Text>
            </View>
            {plan.savings && (
              <Text style={[styles.planSavings, { color: '#4CAF50' }]}>
                {plan.savings}
              </Text>
            )}
          </View>

          <View style={styles.planFeatures}>
            {plan.features.map((feature, index) => (
              <Text
                key={index}
                style={[styles.planFeature, { color: colors.onBackground }]}
              >
                • {feature}
              </Text>
            ))}
          </View>

          <ElevatedButton
            title={isSelected ? 'Selected' : 'Choose Plan'}
            onPress={() => handlePurchase(plan.id)}
            disabled={isPurchasing}
            style={[
              styles.planButton,
              isSelected && { backgroundColor: colors.primary },
            ]}
            textStyle={isSelected ? { color: colors.onPrimary } : undefined}
          />
        </View>
      </TouchableOpacity>
    );
  };

  if (isPremium) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.premiumStatus}>
          <View
            style={[styles.premiumIcon, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.premiumIconText}>⭐</Text>
          </View>
          <Text style={[styles.premiumTitle, { color: colors.onBackground }]}>
            Premium Member
          </Text>
          <Text style={[styles.premiumSubtitle, { color: colors.onSurface }]}>
            You have access to all premium features
          </Text>
          <ElevatedButton
            title="Manage Subscription"
            onPress={() => navigation.goBack()}
            style={styles.manageButton}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View>
        <Toolbar style={styles.header}>
          <View style={styles.headerLeft}>
            <IconButton
              icon={<Text style={{ fontSize: 20 }}>←</Text>}
              onPress={handleBack}
            />
          </View>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.onBackground }]}>
              Go Premium
            </Text>
          </View>
          <View style={styles.headerRight} />
        </Toolbar>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <Text style={[styles.heroTitle, { color: colors.onBackground }]}>
              Unlock Premium Features
            </Text>
            <Text style={[styles.heroSubtitle, { color: colors.onSurface }]}>
              Get access to advanced editing tools, premium filters, and
              exclusive features
            </Text>
          </View>
          <View style={styles.heroIllustration}>
            <Text style={styles.heroStars}>⭐✨🌟</Text>
          </View>
        </View>

        {/* Benefits List */}
        <View style={styles.benefitsSection}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
            What's Included
          </Text>
          <View style={styles.benefitsList}>
            {PREMIUM_FEATURES.map((benefit, index) =>
              renderBenefitItem(benefit, index),
            )}
          </View>
        </View>

        {/* Subscription Plans */}
        <View style={styles.plansSection}>
          <Text style={[styles.sectionTitle, { color: colors.onBackground }]}>
            Choose Your Plan
          </Text>
          {loadingProducts ? (
            <View style={styles.loadingContainer}>
              <LoadingIndicator message="Loading plans..." />
            </View>
          ) : (
            <View style={styles.plansList}>
              {SUBSCRIPTION_PLANS.map(renderSubscriptionPlan)}
            </View>
          )}
        </View>

        {/* Restore Purchases */}
        <View style={styles.restoreSection}>
          <TouchableOpacity
            style={[styles.restoreButton, { backgroundColor: colors.surface }]}
            onPress={handleRestorePurchases}
          >
            <Text style={[styles.restoreText, { color: colors.onBackground }]}>
              Restore Previous Purchases
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Success Animation Overlay - Temporarily disabled */}
      {/* <Animated.View style={[styles.successOverlay, successAnimatedStyle]}>
        <View
          style={[styles.successContainer, { backgroundColor: colors.surface }]}
        >
          <View style={[styles.successCircle, { backgroundColor: '#4CAF50' }]}>
            <Text style={styles.successCheckmark}>✓</Text>
          </View>
          <Text style={[styles.successTitle, { color: colors.onBackground }]}>
            Purchase Successful!
          </Text>
          <Text style={[styles.successSubtitle, { color: colors.onSurface }]}>
            Welcome to Premium
          </Text>
        </View>
      </Animated.View> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  headerCenter: {
    flex: 2,
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.headline2,
    fontWeight: '600',
  },
  headerRight: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  heroContent: {
    flex: 1,
  },
  heroTitle: {
    ...TYPOGRAPHY.headline1,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.body1,
    lineHeight: 24,
  },
  heroIllustration: {
    flex: 1,
    alignItems: 'center',
  },
  heroStars: {
    fontSize: 60,
  },
  benefitsSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    ...TYPOGRAPHY.headline2,
    fontWeight: '600',
    marginBottom: SPACING.lg,
  },
  benefitsList: {
    gap: SPACING.sm,
  },
  benefitItem: {
    padding: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  benefitText: {
    ...TYPOGRAPHY.body2,
  },
  plansSection: {
    marginBottom: SPACING.xl,
  },
  plansList: {
    gap: SPACING.md,
  },
  planTouchable: {
    marginVertical: SPACING.xs,
  },
  planCard: {
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  planCardSelected: {
    borderColor: '#6200EE',
    elevation: 4,
    shadowColor: '#6200EE',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    right: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  popularText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  planHeader: {
    marginBottom: SPACING.lg,
  },
  planTitle: {
    ...TYPOGRAPHY.headline2,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  planPrice: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.xs,
  },
  planPriceAmount: {
    ...TYPOGRAPHY.headline1,
    fontWeight: 'bold',
  },
  planPricePeriod: {
    ...TYPOGRAPHY.body2,
    marginLeft: SPACING.xs,
  },
  planSavings: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  planFeatures: {
    marginBottom: SPACING.lg,
  },
  planFeature: {
    ...TYPOGRAPHY.body2,
    marginBottom: SPACING.xs,
  },
  planButton: {
    width: '100%',
  },
  restoreSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  restoreButton: {
    padding: SPACING.md,
    borderRadius: 8,
  },
  restoreText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '500',
  },
  successOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  successContainer: {
    padding: SPACING.xl,
    borderRadius: 16,
    alignItems: 'center',
    margin: SPACING.lg,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  successCheckmark: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  successTitle: {
    ...TYPOGRAPHY.headline1,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  successSubtitle: {
    ...TYPOGRAPHY.body1,
    textAlign: 'center',
    opacity: 0.8,
  },
  premiumStatus: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  premiumIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  premiumIconText: {
    fontSize: 40,
  },
  premiumTitle: {
    ...TYPOGRAPHY.headline1,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  premiumSubtitle: {
    ...TYPOGRAPHY.body1,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  manageButton: {
    minWidth: 200,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
});
