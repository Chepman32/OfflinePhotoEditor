import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
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
import { triggerHapticFeedback } from '../../utils/accessibility';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

const { width: screenWidth } = Dimensions.get('window');

interface RotateToolProps {
  imageUri: string;
  onRotationChange: (rotation: number, flipH: boolean, flipV: boolean) => void;
  onApply: (rotation: number, flipH: boolean, flipV: boolean) => void;
  onCancel: () => void;
}

interface RotationState {
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
}

const ROTATION_ANGLES = [0, 90, 180, 270];

export const RotateTool: React.FC<RotateToolProps> = ({
  imageUri,
  onRotationChange,
  onApply,
  onCancel,
}) => {
  const { colors } = useTheme();
  const [rotationState, setRotationState] = useState<RotationState>({
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
  });

  // Animation values
  const imageRotation = useSharedValue(0);
  const imageScaleX = useSharedValue(1);
  const imageScaleY = useSharedValue(1);
  const previewOpacity = useSharedValue(1);

  const imageAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${imageRotation.value}deg` },
      { scaleX: imageScaleX.value },
      { scaleY: imageScaleY.value },
    ],
    opacity: previewOpacity.value,
  }));

  const updateRotationState = (newState: RotationState) => {
    setRotationState(newState);
    onRotationChange(
      newState.rotation,
      newState.flipHorizontal,
      newState.flipVertical,
    );
  };

  const handleRotateLeft = () => {
    const newRotation = (rotationState.rotation - 90 + 360) % 360;
    const newState = { ...rotationState, rotation: newRotation };

    imageRotation.value = withSpring(newRotation, {
      damping: 15,
      stiffness: 100,
    });

    updateRotationState(newState);
    triggerHapticFeedback('medium');
  };

  const handleRotateRight = () => {
    const newRotation = (rotationState.rotation + 90) % 360;
    const newState = { ...rotationState, rotation: newRotation };

    imageRotation.value = withSpring(newRotation, {
      damping: 15,
      stiffness: 100,
    });

    updateRotationState(newState);
    triggerHapticFeedback('medium');
  };

  const handleFlipHorizontal = () => {
    const newFlipH = !rotationState.flipHorizontal;
    const newState = { ...rotationState, flipHorizontal: newFlipH };

    imageScaleX.value = withSpring(newFlipH ? -1 : 1, {
      damping: 15,
      stiffness: 100,
    });

    updateRotationState(newState);
    triggerHapticFeedback('medium');
  };

  const handleFlipVertical = () => {
    const newFlipV = !rotationState.flipVertical;
    const newState = { ...rotationState, flipVertical: newFlipV };

    imageScaleY.value = withSpring(newFlipV ? -1 : 1, {
      damping: 15,
      stiffness: 100,
    });

    updateRotationState(newState);
    triggerHapticFeedback('medium');
  };

  const handleRotateToAngle = (angle: number) => {
    const newState = { ...rotationState, rotation: angle };

    imageRotation.value = withSpring(angle, {
      damping: 15,
      stiffness: 100,
    });

    updateRotationState(newState);
    triggerHapticFeedback('medium');
  };

  const handleReset = () => {
    const resetState: RotationState = {
      rotation: 0,
      flipHorizontal: false,
      flipVertical: false,
    };

    imageRotation.value = withSpring(0);
    imageScaleX.value = withSpring(1);
    imageScaleY.value = withSpring(1);

    updateRotationState(resetState);
    triggerHapticFeedback('medium');
  };

  const handleApply = () => {
    // Flash effect before applying
    previewOpacity.value = withTiming(0.7, { duration: 100 }, () => {
      previewOpacity.value = withTiming(1, { duration: 100 });
    });

    onApply(
      rotationState.rotation,
      rotationState.flipHorizontal,
      rotationState.flipVertical,
    );
    triggerHapticFeedback('heavy');
  };

  const getRotationDescription = () => {
    const { rotation, flipHorizontal, flipVertical } = rotationState;
    let description = '';

    if (rotation !== 0) {
      description += `Rotated ${rotation}°`;
    }

    if (flipHorizontal) {
      description += description ? ', Flipped H' : 'Flipped Horizontally';
    }

    if (flipVertical) {
      description += description ? ', Flipped V' : 'Flipped Vertically';
    }

    return description || 'No changes';
  };

  return (
    <View style={styles.container}>
      {/* Preview Area */}
      <View style={styles.previewContainer}>
        <View style={styles.previewFrame}>
          <Animated.View style={[styles.previewImage, imageAnimatedStyle]}>
            <Image
              source={{ uri: imageUri }}
              style={styles.actualImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        <Text style={[styles.descriptionText, { color: colors.onBackground }]}>
          {getRotationDescription()}
        </Text>
      </View>

      {/* Controls */}
      <View
        style={[styles.controlsContainer, { backgroundColor: colors.surface }]}
      >
        <Text style={[styles.toolTitle, { color: colors.onBackground }]}>
          Rotate & Flip
        </Text>

        {/* Quick Rotation Buttons */}
        <View style={styles.quickRotationContainer}>
          <Text style={[styles.sectionLabel, { color: colors.onSurface }]}>
            Quick Rotate
          </Text>
          <View style={styles.quickRotationButtons}>
            {ROTATION_ANGLES.map(angle => (
              <TouchableOpacity
                key={angle}
                style={[
                  styles.quickRotationButton,
                  { backgroundColor: colors.background },
                  rotationState.rotation === angle && {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => handleRotateToAngle(angle)}
              >
                <Text
                  style={[
                    styles.quickRotationText,
                    { color: colors.onBackground },
                    rotationState.rotation === angle && {
                      color: colors.onPrimary,
                    },
                  ]}
                >
                  {angle}°
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Rotation Controls */}
        <View style={styles.rotationControls}>
          <Text style={[styles.sectionLabel, { color: colors.onSurface }]}>
            Rotate
          </Text>
          <View style={styles.rotationButtons}>
            <TouchableOpacity
              style={[
                styles.rotationButton,
                { backgroundColor: colors.background },
              ]}
              onPress={handleRotateLeft}
            >
              <Text style={styles.rotationIcon}>↺</Text>
              <Text
                style={[styles.rotationText, { color: colors.onBackground }]}
              >
                Left 90°
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.rotationButton,
                { backgroundColor: colors.background },
              ]}
              onPress={handleRotateRight}
            >
              <Text style={styles.rotationIcon}>↻</Text>
              <Text
                style={[styles.rotationText, { color: colors.onBackground }]}
              >
                Right 90°
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Flip Controls */}
        <View style={styles.flipControls}>
          <Text style={[styles.sectionLabel, { color: colors.onSurface }]}>
            Flip
          </Text>
          <View style={styles.flipButtons}>
            <TouchableOpacity
              style={[
                styles.flipButton,
                { backgroundColor: colors.background },
                rotationState.flipHorizontal && {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={handleFlipHorizontal}
            >
              <Text style={styles.flipIcon}>⇄</Text>
              <Text
                style={[
                  styles.flipText,
                  { color: colors.onBackground },
                  rotationState.flipHorizontal && {
                    color: colors.onPrimary,
                  },
                ]}
              >
                Horizontal
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.flipButton,
                { backgroundColor: colors.background },
                rotationState.flipVertical && {
                  backgroundColor: colors.primary,
                },
              ]}
              onPress={handleFlipVertical}
            >
              <Text style={styles.flipIcon}>⇅</Text>
              <Text
                style={[
                  styles.flipText,
                  { color: colors.onBackground },
                  rotationState.flipVertical && {
                    color: colors.onPrimary,
                  },
                ]}
              >
                Vertical
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.resetButton, { backgroundColor: colors.background }]}
            onPress={handleReset}
          >
            <Text style={[styles.resetText, { color: colors.onBackground }]}>
              Reset
            </Text>
          </TouchableOpacity>

          <View style={styles.mainActions}>
            <TouchableOpacity
              style={[
                styles.cancelButton,
                { backgroundColor: colors.background },
              ]}
              onPress={onCancel}
            >
              <Text style={[styles.cancelText, { color: colors.onBackground }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApply}
            >
              <Text style={[styles.applyText, { color: colors.onPrimary }]}>
                Apply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  previewFrame: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  actualImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  descriptionText: {
    ...TYPOGRAPHY.body2,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  controlsContainer: {
    padding: SPACING.md,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  toolTitle: {
    ...TYPOGRAPHY.headline2,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    ...TYPOGRAPHY.body2,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  quickRotationContainer: {
    marginBottom: SPACING.lg,
  },
  quickRotationButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  quickRotationButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickRotationText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  rotationControls: {
    marginBottom: SPACING.lg,
  },
  rotationButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  rotationButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  rotationIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  rotationText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  flipControls: {
    marginBottom: SPACING.lg,
  },
  flipButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  flipButton: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  flipIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  flipText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  resetButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
  },
  resetText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  mainActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  cancelButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  cancelText: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
  },
  applyButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  applyText: {
    ...TYPOGRAPHY.body1,
    fontWeight: '600',
  },
});
