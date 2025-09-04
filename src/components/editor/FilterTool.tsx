import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StyleSheet,
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
import { triggerHapticFeedback, useAccessibility } from '../../utils/accessibility';
import { ElevatedButton } from '../common/ElevatedButton';
import { Card } from '../common/Card';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

interface FilterToolProps {
  onFilterSelect: (filterId: string, intensity: number) => void;
  onIntensityChange: (intensity: number) => void;
  onApply: () => void;
  onCancel: () => void;
  selectedFilter?: string;
  currentIntensity?: number;
}

interface Filter {
  id: string;
  name: string;
  category: string;
  preview: string;
  isPremium?: boolean;
}

interface FilterCategory {
  id: string;
  name: string;
  icon: string;
}

const FILTER_CATEGORIES: FilterCategory[] = [
  { id: 'basic', name: 'Basic', icon: '🎨' },
  { id: 'vintage', name: 'Vintage', icon: '📷' },
  { id: 'artistic', name: 'Artistic', icon: '🎭' },
  { id: 'color', name: 'Color', icon: '🌈' },
  { id: 'blackwhite', name: 'B&W', icon: '⚫' },
  { id: 'premium', name: 'Premium', icon: '⭐' },
];

const FILTERS: Filter[] = [
  // Basic Filters
  { id: 'none', name: 'None', category: 'basic', preview: '⬜' },
  { id: 'brightness', name: 'Brightness', category: 'basic', preview: '☀️' },
  { id: 'contrast', name: 'Contrast', category: 'basic', preview: '🌓' },
  { id: 'saturation', name: 'Saturation', category: 'basic', preview: '🌈' },

  // Vintage Filters
  { id: 'sepia', name: 'Sepia', category: 'vintage', preview: '🏛️' },
  { id: 'vintage_fade', name: 'Fade', category: 'vintage', preview: '📜' },
  { id: 'warm_tone', name: 'Warm', category: 'vintage', preview: '🌅' },

  // Artistic Filters
  { id: 'oil_paint', name: 'Oil Paint', category: 'artistic', preview: '🎨' },
  { id: 'watercolor', name: 'Watercolor', category: 'artistic', preview: '💧' },
  { id: 'sketch', name: 'Sketch', category: 'artistic', preview: '✏️' },

  // Color Filters
  { id: 'vivid', name: 'Vivid', category: 'color', preview: '💎' },
  { id: 'cool_tone', name: 'Cool', category: 'color', preview: '🧊' },
  { id: 'neon', name: 'Neon', category: 'color', preview: '⚡' },

  // Black & White
  { id: 'grayscale', name: 'Grayscale', category: 'blackwhite', preview: '⚪' },
  { id: 'high_contrast_bw', name: 'High Contrast', category: 'blackwhite', preview: '🔳' },

  // Premium Filters
  { id: 'cinematic', name: 'Cinematic', category: 'premium', preview: '🎬', isPremium: true },
  { id: 'portrait_perfect', name: 'Portrait', category: 'premium', preview: '👤', isPremium: true },
  { id: 'landscape_epic', name: 'Landscape', category: 'premium', preview: '🏔️', isPremium: true },
  { id: 'dreamy', name: 'Dreamy', category: 'premium', preview: '💭', isPremium: true },
];

export const FilterTool: React.FC<FilterToolProps> = ({
  onFilterSelect,
  onIntensityChange,
  onApply,
  onCancel,
  selectedFilter = 'none',
  currentIntensity = 50,
}) => {
  const { colors } = useTheme();
  const { reduceMotionEnabled } = useAccessibility();

  const [activeCategory, setActiveCategory] = useState('basic');
  const [intensity, setIntensity] = useState(currentIntensity);
  const [appliedFilter, setAppliedFilter] = useState(selectedFilter);

  // Animation values
  const categoryIndicatorPosition = useSharedValue(0);
  const filterPreviewScale = useSharedValue(1);
  const intensityBarOpacity = useSharedValue(1);

  const handleCategorySelect = (categoryId: string, index: number) => {
    setActiveCategory(categoryId);
    triggerHapticFeedback('light');

    if (!reduceMotionEnabled) {
      categoryIndicatorPosition.value = withSpring(index * 80, {
        damping: 20,
        stiffness: 100,
      });
    }
  };

  const handleFilterSelect = (filter: Filter) => {
    setAppliedFilter(filter.id);
    onFilterSelect(filter.id, intensity);
    triggerHapticFeedback('medium');

    if (!reduceMotionEnabled) {
      filterPreviewScale.value = withSequence(
        withSpring(1.1, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
    }
  };

  const handleIntensityChange = (newIntensity: number) => {
    const clampedIntensity = Math.max(0, Math.min(100, newIntensity));
    setIntensity(clampedIntensity);
    onIntensityChange(clampedIntensity);
    triggerHapticFeedback('light');

    intensityBarOpacity.value = withSequence(
      withTiming(0.7, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  const categoryIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: categoryIndicatorPosition.value }],
  }));

  const filterPreviewStyle = useAnimatedStyle(() => ({
    transform: [{ scale: filterPreviewScale.value }],
  }));

  const intensityBarStyle = useAnimatedStyle(() => ({
    opacity: intensityBarOpacity.value,
  }));

  const filteredFilters = FILTERS.filter(filter => filter.category === activeCategory);

  const renderCategoryTab = (category: FilterCategory, index: number) => {
    const isActive = activeCategory === category.id;

    return (
      <TouchableOpacity
        key={category.id}
        style={[
          styles.categoryTab,
          isActive && [styles.categoryTabActive, { backgroundColor: colors.primary + '20' }],
        ]}
        onPress={() => handleCategorySelect(category.id, index)}
      >
        <Text style={styles.categoryIcon}>{category.icon}</Text>
        <Text
          style={[
            styles.categoryText,
            { color: isActive ? colors.primary : colors.onBackground },
          ]}
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFilterItem = ({ item }: { item: Filter }) => {
    const isSelected = appliedFilter === item.id;

    return (
      <TouchableOpacity
        style={[
          styles.filterItem,
          { backgroundColor: colors.surface },
          isSelected && [styles.filterItemSelected, { borderColor: colors.primary }],
        ]}
        onPress={() => handleFilterSelect(item)}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.filterPreview, filterPreviewStyle]}>
          <Text style={styles.filterPreviewIcon}>{item.preview}</Text>
          {item.isPremium && (
            <View style={[styles.premiumBadge, { backgroundColor: '#FFD700' }]}>
              <Text style={styles.premiumIcon}>⭐</Text>
            </View>
          )}
        </Animated.View>

        <Text
          style={[
            styles.filterName,
            { color: isSelected ? colors.primary : colors.onBackground },
          ]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Category Tabs */}
      <Card style={styles.categoryCard}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {FILTER_CATEGORIES.map((category, index) => renderCategoryTab(category, index))}
        </ScrollView>

        {/* Active Category Indicator */}
        <Animated.View
          style={[
            styles.categoryIndicator,
            { backgroundColor: colors.primary },
            categoryIndicatorStyle,
          ]}
        />
      </Card>

      {/* Filter Grid */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={filteredFilters}
          renderItem={renderFilterItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.filtersGrid}
        />
      </View>

      {/* Intensity Control */}
      {appliedFilter !== 'none' && (
        <Card style={styles.intensityCard}>
          <Text style={[styles.intensityTitle, { color: colors.onBackground }]}>
            Intensity: {intensity}%
          </Text>

          <View style={styles.sliderContainer}>
            <TouchableOpacity
              style={[styles.sliderTrack, { backgroundColor: colors.surface }]}
              onPress={(event) => {
                const { locationX } = event.nativeEvent;
                const trackWidth = 280;
                const newIntensity = Math.round((locationX / trackWidth) * 100);
                handleIntensityChange(newIntensity);
              }}
            >
              <Animated.View
                style={[
                  styles.sliderFill,
                  {
                    width: `${intensity}%`,
                    backgroundColor: colors.primary,
                  },
                  intensityBarStyle,
                ]}
              />
              <Animated.View
                style={[
                  styles.sliderThumb,
                  {
                    left: `${intensity}%`,
                    backgroundColor: colors.primary,
                  },
                  intensityBarStyle,
                ]}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.sliderLabels}>
            <Text style={[styles.sliderLabel, { color: colors.onSurface }]}>0%</Text>
            <Text style={[styles.sliderLabel, { color: colors.onSurface }]}>100%</Text>
          </View>

          {/* Intensity Preview */}
          <View style={styles.intensityPreview}>
            {[25, 50, 75, 100].map((value) => (
              <Animated.View
                key={value}
                style={[
                  styles.intensityLevel,
                  {
                    backgroundColor: intensity >= value ? colors.primary : colors.surface,
                    opacity: intensity >= value ? 1 : 0.3,
                  },
                  intensityBarStyle,
                ]}
              />
            ))}
          </View>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: colors.surface }]}
          onPress={onCancel}
        >
          <Text style={[styles.cancelText, { color: colors.onBackground }]}>
            Cancel
          </Text>
        </TouchableOpacity>

        <ElevatedButton
          title="Apply Filter"
          onPress={onApply}
          style={styles.applyButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  categoryCard: {
    margin: SPACING.md,
    position: 'relative',
  },
  categoryScroll: {
    paddingHorizontal: SPACING.md,
  },
  categoryTab: {
    alignItems: 'center',
    padding: SPACING.md,
    marginRight: SPACING.sm,
    borderRadius: 8,
    minWidth: 70,
  },
  categoryTabActive: {
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 20,
    marginBottom: SPACING.xs,
  },
  categoryText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '500',
  },
  categoryIndicator: {
    position: 'absolute',
    bottom: 0,
    left: SPACING.md,
    width: 70,
    height: 3,
    borderRadius: 2,
  },
  filtersContainer: {
    flex: 1,
  },
  filtersGrid: {
    padding: SPACING.md,
  },
  filterItem: {
    flex: 1,
    margin: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
    maxWidth: 100,
  },
  filterItemSelected: {
    borderWidth: 2,
    elevation: 4,
  },
  filterPreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    position: 'relative',
  },
  filterPreviewIcon: {
    fontSize: 30,
  },
  premiumBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumIcon: {
    fontSize: 12,
  },
  filterName: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    fontWeight: '500',
  },
  intensityCard: {
    margin: SPACING.md,
  },
  intensityTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  sliderContainer: {
    marginBottom: SPACING.sm,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    ...TYPOGRAPHY.caption,
  },
  intensityPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  intensityLevel: {
    width: 15,
    height: 30,
    borderRadius: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
    margin: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelText: {
    ...TYPOGRAPHY.body1,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
  },
});
