import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Image,
  PanResponder,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence } from 'react-native-reanimated';
import { useTheme } from '../../utils/theme';
import { triggerHapticFeedback, useAccessibility } from '../../utils/accessibility';
import { ElevatedButton } from '../common/ElevatedButton';
import { Card } from '../common/Card';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';
import { MaskedBlurPreview } from './MaskedBlurPreview';

const { width } = Dimensions.get('window');

interface BlurToolProps {
  imageUri: string;
  imageWidth: number; // display size on stage
  imageHeight: number; // display size on stage
  actualImageWidth?: number; // for conversion when applying, optional
  actualImageHeight?: number;
  initialIntensity?: number;
  onApply: (data: { x: number; y: number; width: number; height: number; intensity: number }) => void;
  onCancel: () => void;
}

export const BlurTool: React.FC<BlurToolProps> = ({
  imageUri,
  imageWidth,
  imageHeight,
  actualImageWidth,
  actualImageHeight,
  initialIntensity = 50,
  onApply,
  onCancel,
}) => {
  const { colors } = useTheme();
  const { reduceMotionEnabled } = useAccessibility();

  const [intensity, setIntensity] = useState(initialIntensity);
  // Selection rectangle (like Crop)
  const initialRect = {
    x: imageWidth * 0.2,
    y: imageHeight * 0.2,
    width: imageWidth * 0.6,
    height: imageHeight * 0.5,
  };
  const selX = useSharedValue(initialRect.x);
  const selY = useSharedValue(initialRect.y);
  const selW = useSharedValue(initialRect.width);
  const selH = useSharedValue(initialRect.height);
  const [rect, setRect] = useState(initialRect);

  // Animation values
  const intensityIndicatorOpacity = useSharedValue(1);

  const handleIntensityChange = (newIntensity: number) => {
    const clampedIntensity = Math.max(0, Math.min(100, newIntensity));
    setIntensity(clampedIntensity);
    triggerHapticFeedback('light');

    intensityIndicatorOpacity.value = withSequence(
      withTiming(0.7, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );
  };

  const intensityIndicatorStyle = useAnimatedStyle(() => ({
    opacity: intensityIndicatorOpacity.value,
  }));

  // Stage overlay styles
  const overlayStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: selX.value }, { translateY: selY.value }],
    width: selW.value,
    height: selH.value,
  }));

  // Drag to move selection
  const dragStart = useRef({ x: 0, y: 0 }).current;
  const dragResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStart.x = selX.value;
        dragStart.y = selY.value;
      },
      onPanResponderMove: (_evt, gesture) => {
        const nx = Math.max(0, Math.min(dragStart.x + gesture.dx, imageWidth - selW.value));
        const ny = Math.max(0, Math.min(dragStart.y + gesture.dy, imageHeight - selH.value));
        selX.value = nx;
        selY.value = ny;
        setRect(r => ({ ...r, x: nx, y: ny }));
      },
    })
  ).current;

  // Corner handles to resize
  const sizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 }).current;
  const MIN_SIZE = 40;
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(v, max));
  const corner = (name: 'tl'|'tr'|'bl'|'br') => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: () => {
      sizeStart.x = selX.value; sizeStart.y = selY.value; sizeStart.w = selW.value; sizeStart.h = selH.value;
    },
    onPanResponderMove: (_e, g) => {
      let nx = sizeStart.x, ny = sizeStart.y, nw = sizeStart.w, nh = sizeStart.h;
      if (name === 'br') { nw = clamp(sizeStart.w + g.dx, MIN_SIZE, imageWidth - sizeStart.x); nh = clamp(sizeStart.h + g.dy, MIN_SIZE, imageHeight - sizeStart.y); }
      if (name === 'bl') { nx = clamp(sizeStart.x + g.dx, 0, sizeStart.x + sizeStart.w - MIN_SIZE); nw = clamp(sizeStart.w - (nx - sizeStart.x), MIN_SIZE, imageWidth); nh = clamp(sizeStart.h + g.dy, MIN_SIZE, imageHeight - sizeStart.y); }
      if (name === 'tr') { ny = clamp(sizeStart.y + g.dy, 0, sizeStart.y + sizeStart.h - MIN_SIZE); nh = clamp(sizeStart.h - (ny - sizeStart.y), MIN_SIZE, imageHeight); nw = clamp(sizeStart.w + g.dx, MIN_SIZE, imageWidth - sizeStart.x); }
      if (name === 'tl') { nx = clamp(sizeStart.x + g.dx, 0, sizeStart.x + sizeStart.w - MIN_SIZE); ny = clamp(sizeStart.y + g.dy, 0, sizeStart.y + sizeStart.h - MIN_SIZE); nw = clamp(sizeStart.w - (nx - sizeStart.x), MIN_SIZE, imageWidth); nh = clamp(sizeStart.h - (ny - sizeStart.y), MIN_SIZE, imageHeight); }
      // Ensure inside bounds
      nx = clamp(nx, 0, imageWidth - nw); ny = clamp(ny, 0, imageHeight - nh);
      selX.value = nx; selY.value = ny; selW.value = nw; selH.value = nh;
      setRect({ x: nx, y: ny, width: nw, height: nh });
    }
  });
  const tl = useRef(corner('tl')).current;
  const tr = useRef(corner('tr')).current;
  const bl = useRef(corner('bl')).current;
  const br = useRef(corner('br')).current;

  const toApplyData = () => {
    const sx = actualImageWidth ? actualImageWidth / imageWidth : 1;
    const sy = actualImageHeight ? actualImageHeight / imageHeight : 1;
    return {
      x: Math.round(selX.value * sx),
      y: Math.round(selY.value * sy),
      width: Math.round(selW.value * sx),
      height: Math.round(selH.value * sy),
      intensity,
    };
  };

  return (
    <View style={styles.container}>
      {/* Stage with image and live masked blur */}
      <View style={styles.stageCard}>
        <View style={[styles.stage, { width: imageWidth, height: imageHeight }]}>
          <Image source={{ uri: imageUri }} style={styles.stageImage} resizeMode="contain" />
          <MaskedBlurPreview uri={imageUri} rect={rect} intensity={intensity} />

          {/* Selection overlay */}
          <Animated.View style={[styles.selection, overlayStyle]} {...dragResponder.panHandlers}>
            <View style={styles.selectionFrame} />
            {/* Handles */}
            <View style={[styles.handle, styles.tl]} {...tl.panHandlers} />
            <View style={[styles.handle, styles.tr]} {...tr.panHandlers} />
            <View style={[styles.handle, styles.bl]} {...bl.panHandlers} />
            <View style={[styles.handle, styles.br]} {...br.panHandlers} />
          </Animated.View>
        </View>
      </View>

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
          onPress={() => onApply(toApplyData())}
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
  stageCard: {
    alignItems: 'center',
    padding: SPACING.md,
  },
  stage: {
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000',
    borderRadius: 8,
  },
  stageImage: { width: '100%', height: '100%' },
  selection: { position: 'absolute' },
  selectionFrame: { flex: 1, borderWidth: 2, borderColor: '#FFFFFF99' },
  handle: { position: 'absolute', width: 20, height: 20, backgroundColor: '#fff' },
  tl: { top: -10, left: -10 },
  tr: { top: -10, right: -10 },
  bl: { bottom: -10, left: -10 },
  br: { bottom: -10, right: -10 },
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
