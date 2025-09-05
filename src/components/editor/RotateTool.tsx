import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  ViewStyle,
} from 'react-native';
// No preview and no view-shot: use processor rotation
import { useTheme } from '../../utils/theme';
import { triggerHapticFeedback } from '../../utils/accessibility';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

const { width: screenWidth } = Dimensions.get('window');

interface RotateToolProps {
  imageUri: string;
  onRotate: (processedUri: string, finalize?: boolean) => void;
  outputWidth?: number;
  outputHeight?: number;
  onCancel: () => void;
}

// Rotation is fixed at 90° clockwise per apply

export const RotateTool: React.FC<RotateToolProps> = ({
  imageUri,
  onRotate,
  outputWidth,
  outputHeight,
  onCancel,
}) => {
  const { colors } = useTheme();

  // Current rotation angle selected via buttons
  const [rotationAngle, setRotationAngle] = useState<number>(90);

  const MAX_DIM = 2048; // lower cap to avoid iOS capture stalls
  const baseW = Math.min(outputWidth || Math.round(screenWidth * 0.6), MAX_DIM);
  const baseH = Math.min(outputHeight || Math.round(screenWidth * 0.6), MAX_DIM);
  const stageW = rotationAngle === 90 || rotationAngle === 270 ? baseH : baseW;
  const stageH = rotationAngle === 90 || rotationAngle === 270 ? baseW : baseH;

  const stageStyle: ViewStyle = {}; // not used anymore

  const handleApply = async () => {
    // Do NOT rotate again on Apply; just finalize current state
    onRotate(imageUri, true);
  };

  const rotateViaProcessor = async (angle: number, finalize = false) => {
    try {
      const { imageProcessor } = await import('../../services/imageProcessor');
      const result = await imageProcessor.processImage(imageUri, [
        { type: 'rotate', angle },
      ]);
      if (result.processedUri) {
        onRotate(result.processedUri, finalize);
        triggerHapticFeedback('heavy');
      }
    } catch (e) {
      console.error('Processor rotate failed:', e);
    }
  };

  const rotateLeft = async () => {
    await rotateViaProcessor(270, false);
  };

  const rotateRight = async () => {
    await rotateViaProcessor(90, false);
  };

  return (
    <View style={styles.container}>
      {/* no hidden stage; rotation handled by processor */}

      {/* Minimal controls with Rotate Left/Right and Cancel/Apply */}
      <View style={[styles.controlsContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.toolTitle, { color: colors.onBackground }]}>Rotate</Text>
        <View style={styles.rotationButtons}>
          <TouchableOpacity
            style={[styles.rotationButton, { backgroundColor: colors.background }]}
            onPress={rotateLeft}
          >
            <Text style={styles.rotationIcon}>↺</Text>
            <Text style={[styles.rotationText, { color: colors.onBackground }]}>Left 90°</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.rotationButton, { backgroundColor: colors.background }]}
            onPress={rotateRight}
          >
            <Text style={styles.rotationIcon}>↻</Text>
            <Text style={[styles.rotationText, { color: colors.onBackground }]}>Right 90°</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.cancelButton, { backgroundColor: colors.background }]}
            onPress={onCancel}
          >
            <Text style={[styles.cancelText, { color: colors.onBackground }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: colors.primary }]}
            onPress={handleApply}
          >
            <Text style={[styles.applyText, { color: colors.onPrimary }]}>Apply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actualImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  controlsContainer: {
    padding: SPACING.md,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  toolTitle: {
    ...TYPOGRAPHY.headline2,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  rotationButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.md,
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
