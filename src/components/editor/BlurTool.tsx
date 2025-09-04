import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/theme';
import { triggerHapticFeedback, useAccessibility } from '../../utils/accessibility';
import { ElevatedButton } from '../common/ElevatedButton';
import { Card } from '../common/Card';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

const { width } = Dimensions.get('window');

interface BlurToolProps {
  initialBrushSize?: number;
  initialIntensity?: number;
  onBrushSizeChange: (size: number) => void;
  onIntensityChange: (intensity: number) => void;
  onUndo: () => void;
  onApply: () => void;
  onCancel: () => void;
}

export const BlurTool: React.FC<BlurToolProps> = ({
  initialBrushSize = 25,
  initialIntensity = 50,
  onBrushSizeChange,
  onIntensityChange,
  onUndo,
  onApply,
  onCancel,
}) => {
  const { colors } = useTheme();
  const { reduceMotionEnabled } = useAccessibility();

  const [brushSize, setBrushSize] = useState(initialBrushSize);
  const [intensity, setIntensity] = useState(initialIntensity);

  // Animation values
  const brushPreviewScale = useSharedValue(1);
  const intensityIndicatorOpacity = useSharedValue(1);

  const handleBrushSizeChange = (size: number) => {
    const newSize = Math.max(5, Math.min(50, size));
    setBrushSize(newSize);
    onBrushSizeChange(newSize);
    triggerHapticFeedback('light');

    if (!reduceMotionEnabled) {
      brushPreviewScale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 300 }),
        withSpring(1, { damping: 12, stiffness: 200 })
      );
    }
  };

  const handleIntensityChange = (newIntensity: number) => {
    const clampedIntensity = Math.max(0, Math.min(100, newIntensity));
    setIntensity(clampedIntensity);
    onIntensityChange(clampedIntensity);
    triggerHapticFeedback('light');

    intensityIndicatorOpacity.value = withSequence(
      withTiming(0.7, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  const handleUndoPress = () => {
    onUndo();
    triggerHapticFeedback('medium');
  };

  const brushPreviewStyle = useAnimatedStyle(() => ({
    transform: [{ scale: brushPreviewScale.value }],
  }));

  const intensityIndicatorStyle = useAnimatedStyle(() => ({
    opacity: intensityIndicatorOpacity.value,
  }));

  const getIntensityColor = () => {
    const alpha = intensity / 100;
    return `rgba(100, 149, 237, ${alpha})`; // Cornflower blue with varying opacity
  };

  return (
    <View style={styles.container}>
      {/* Brush Preview */}
      <Card style={styles.previewCard}>
        <Text style={[styles.previewTitle, { color: colors.onBackground }]}>
          Brush Preview
        </Text>
        <View style={styles.previewContainer}>
          <Animated.View
            style={[
              styles.brushPreview,
              {
                width: brushSize * 2,
                height: brushSize * 2,
                borderRadius: brushSize,
                backgroundColor: getIntensityColor(),
              },
              brushPreviewStyle,
            ]}
          >
            <View
              style={[
                styles.brushCenter,
                {
                  width: brushSize * 0.3,
                  height: brushSize * 0.3,
                  borderRadius: brushSize * 0.15,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </Animated.View>
        </View>
        <Text style={[styles.previewStats, { color: colors.onSurface }]}>
          Size: {brushSize}px • Intensity: {intensity}%
        </Text>
      </Card>

      {/* Brush Size Control */}
      <Card style={styles.controlCard}>
        <Text style={[styles.controlTitle, { color: colors.onBackground }]}>
          Brush Size: {brushSize}px
        </Text>
        <View style={styles.sliderContainer}>
          <TouchableOpacity
            style={[styles.sliderTrack, { backgroundColor: colors.surface }]}
            onPress={(event) => {
              const { locationX } = event.nativeEvent;
              const trackWidth = width - SPACING.xl * 4;
              const newSize = Math.round((locationX / trackWidth) * 45 + 5);
              handleBrushSizeChange(newSize);
            }}
          >
            <View
              style={[
                styles.sliderFill,
                {
                  width: `${((brushSize - 5) / 45) * 100}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
            <View
              style={[
                styles.sliderThumb,
                {
                  left: `${((brushSize - 5) / 45) * 100}%`,
                  backgroundColor: colors.primary,
                },
              ]}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.sliderLabels}>
          <Text style={[styles.sliderLabel, { color: colors.onSurface }]}>5px</Text>
          <Text style={[styles.sliderLabel, { color: colors.onSurface }]}>50px</Text>
        </View>

        {/* Quick Size Buttons */}
        <View style={styles.quickButtons}>
          {[10, 25, 40].map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.quickButton,
                { backgroundColor: colors.surface },
                brushSize === size && [styles.quickButtonActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => handleBrushSizeChange(size)}
            >
              <Text
                style={[
                  styles.quickButtonText,
                  { color: brushSize === size ? colors.onPrimary : colors.onBackground },
                ]}
              >
                {size}px
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Intensity Control */}
      <Card style={styles.controlCard}>
        <Text style={[styles.controlTitle, { color: colors.onBackground }]}>
          Blur Intensity: {intensity}%
        </Text>
        <View style={styles.sliderContainer}>
          <TouchableOpacity
            style={[styles.sliderTrack, { backgroundColor: colors.surface }]}
            onPress={(event) => {
              const { locationX } = event.nativeEvent;
              const trackWidth = width - SPACING.xl * 4;
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
                intensityIndicatorStyle,
              ]}
            />
            <Animated.View
              style={[
                styles.sliderThumb,
                {
                  left: `${intensity}%`,
                  backgroundColor: colors.primary,
                },
                intensityIndicatorStyle,
              ]}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.sliderLabels}>
          <Text style={[styles.sliderLabel, { color: colors.onSurface }]}>0%</Text>
          <Text style={[styles.sliderLabel, { color: colors.onSurface }]}>100%</Text>
        </View>

        {/* Intensity Preview Bars */}
        <View style={styles.intensityPreview}>
          {[20, 40, 60, 80, 100].map((value) => (
            <View
              key={value}
              style={[
                styles.intensityBar,
                {
                  backgroundColor: intensity >= value ? colors.primary : colors.surface,
                  opacity: intensity >= value ? 1 : 0.3,
                },
              ]}
            />
          ))}
        </View>
      </Card>

      {/* Undo Button */}
      <Card style={styles.undoCard}>
        <TouchableOpacity
          style={[styles.undoButton, { backgroundColor: colors.surface }]}
          onPress={handleUndoPress}
        >
          <Text style={styles.undoIcon}>↶</Text>
          <Text style={[styles.undoText, { color: colors.onBackground }]}>
            Undo Last Stroke
          </Text>
        </TouchableOpacity>
      </Card>

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
          title="Apply Blur"
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
    padding: SPACING.md,
  },
  previewCard: {
    alignItems: 'center',
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  previewTitle: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  previewContainer: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  brushPreview: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  brushCenter: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  previewStats: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
  },
  controlCard: {
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  controlTitle: {
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
  quickButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
  },
  quickButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  quickButtonActive: {
    elevation: 2,
  },
  quickButtonText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '500',
  },
  intensityPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  intensityBar: {
    width: 20,
    height: 40,
    borderRadius: 4,
  },
  undoCard: {
    marginBottom: SPACING.md,
  },
  undoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderRadius: 8,
  },
  undoIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  undoText: {
    ...TYPOGRAPHY.body1,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
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
