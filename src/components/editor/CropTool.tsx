import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  PanResponder,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '../../utils/theme';
import { triggerHapticFeedback } from '../../utils/accessibility';
import { TYPOGRAPHY } from '../../constants/typography';
import { SPACING } from '../../constants/spacing';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CropToolProps {
  imageUri: string;
  imageWidth: number;
  imageHeight: number;
  actualImageWidth?: number;
  actualImageHeight?: number;
  onCropChange: (cropData: CropData) => void;
  onApply: (cropData: CropData) => void;
  onCancel: () => void;
}

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  aspectRatio?: number;
}

const ASPECT_RATIOS = [
  { label: 'Free', ratio: null },
  { label: '1:1', ratio: 1 },
  { label: '4:3', ratio: 4 / 3 },
  { label: '3:4', ratio: 3 / 4 },
  { label: '16:9', ratio: 16 / 9 },
  { label: '9:16', ratio: 9 / 16 },
];

export const CropTool: React.FC<CropToolProps> = ({
  imageUri,
  imageWidth,
  imageHeight,
  actualImageWidth,
  actualImageHeight,
  onCropChange,
  onApply,
  onCancel,
}) => {
  const { colors } = useTheme();
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<number | null>(
    null,
  );
  const [cropData, setCropData] = useState<CropData>({
    x: 0,
    y: 0,
    width: imageWidth,
    height: imageHeight,
  });

  // Animation values for crop overlay
  const cropX = useSharedValue(imageWidth * 0.1);
  const cropY = useSharedValue(imageHeight * 0.1);
  const cropWidth = useSharedValue(imageWidth * 0.8);
  const cropHeight = useSharedValue(imageHeight * 0.8);

  const cropOverlayStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: cropX.value }, { translateY: cropY.value }],
    width: cropWidth.value,
    height: cropHeight.value,
  }));

  // Dim overlay pieces derived from crop values
  const topDimStyle = useAnimatedStyle(() => ({
    left: 0,
    right: 0,
    top: 0,
    height: Math.max(0, cropY.value),
  }));
  const leftDimStyle = useAnimatedStyle(() => ({
    left: 0,
    top: cropY.value,
    width: Math.max(0, cropX.value),
    height: cropHeight.value,
  }));
  const rightDimStyle = useAnimatedStyle(() => ({
    right: 0,
    top: cropY.value,
    left: cropX.value + cropWidth.value,
    height: cropHeight.value,
  }));
  const bottomDimStyle = useAnimatedStyle(() => ({
    left: 0,
    right: 0,
    top: cropY.value + cropHeight.value,
    bottom: 0,
  }));

  const updateCropData = () => {
    // Convert screen coordinates to actual image coordinates
    // The imageWidth/imageHeight are the display dimensions on screen
    // actualImageWidth/actualImageHeight are the real image dimensions
    const scaleX = actualImageWidth ? actualImageWidth / imageWidth : 1;
    const scaleY = actualImageHeight ? actualImageHeight / imageHeight : 1;

    console.log('Coordinate conversion:', {
      screenDimensions: { width: imageWidth, height: imageHeight },
      actualDimensions: { width: actualImageWidth, height: actualImageHeight },
      scale: { x: scaleX, y: scaleY },
      cropPosition: { x: cropX.value, y: cropY.value },
      cropSize: { width: cropWidth.value, height: cropHeight.value },
    });

    const newCropData: CropData = {
      x: Math.round(cropX.value * scaleX),
      y: Math.round(cropY.value * scaleY),
      width: Math.round(cropWidth.value * scaleX),
      height: Math.round(cropHeight.value * scaleY),
      aspectRatio: selectedAspectRatio || undefined,
    };
    
    console.log('Converted crop data:', newCropData);
    setCropData(newCropData);
    onCropChange(newCropData);
  };

  const handleAspectRatioSelect = (ratio: number | null) => {
    setSelectedAspectRatio(ratio);
    triggerHapticFeedback('medium');

    if (ratio) {
      // Adjust crop to the selected aspect ratio and center it
      const centerX = cropX.value + cropWidth.value / 2;
      const centerY = cropY.value + cropHeight.value / 2;

      let newWidth = cropWidth.value;
      let newHeight = newWidth / ratio;

      if (newHeight > imageHeight) {
        newHeight = Math.min(imageHeight, cropHeight.value);
        newWidth = newHeight * ratio;
      }
      if (newWidth > imageWidth) {
        newWidth = imageWidth;
        newHeight = newWidth / ratio;
      }

      // Position to keep center
      let nextX = centerX - newWidth / 2;
      let nextY = centerY - newHeight / 2;

      // Clamp within image bounds
      nextX = Math.max(0, Math.min(nextX, imageWidth - newWidth));
      nextY = Math.max(0, Math.min(nextY, imageHeight - newHeight));

      cropX.value = withSpring(nextX);
      cropY.value = withSpring(nextY);
      cropWidth.value = withSpring(newWidth);
      cropHeight.value = withSpring(newHeight);
    }

    setTimeout(updateCropData, 300);
  };

  const handleReset = () => {
    cropX.value = withSpring(imageWidth * 0.1);
    cropY.value = withSpring(imageHeight * 0.1);
    cropWidth.value = withSpring(imageWidth * 0.8);
    cropHeight.value = withSpring(imageHeight * 0.8);
    setSelectedAspectRatio(null);
    triggerHapticFeedback('medium');
    setTimeout(updateCropData, 300);
  };

  const handleApply = () => {
    onApply(cropData);
    triggerHapticFeedback('heavy');
  };

  // Initialize crop data once mounted
  useEffect(() => {
    updateCropData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Gesture: move entire crop area
  const dragStart = useRef({ x: 0, y: 0 }).current;
  const dragResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStart.x = cropX.value;
        dragStart.y = cropY.value;
      },
      onPanResponderMove: (_evt, gesture) => {
        const nx = Math.max(
          0,
          Math.min(dragStart.x + gesture.dx, imageWidth - cropWidth.value),
        );
        const ny = Math.max(
          0,
          Math.min(dragStart.y + gesture.dy, imageHeight - cropHeight.value),
        );
        cropX.value = nx;
        cropY.value = ny;
      },
      onPanResponderRelease: () => {
        updateCropData();
      },
    }),
  ).current;

  // Helpers for corner handle gestures
  const sizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 }).current;
  const MIN_SIZE = 40;

  const createCornerResponder = (
    corner: 'tl' | 'tr' | 'bl' | 'br',
  ) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        sizeStart.x = cropX.value;
        sizeStart.y = cropY.value;
        sizeStart.w = cropWidth.value;
        sizeStart.h = cropHeight.value;
      },
      onPanResponderMove: (_evt, gesture) => {
        let nx = sizeStart.x;
        let ny = sizeStart.y;
        let nw = sizeStart.w;
        let nh = sizeStart.h;
        const ratio = selectedAspectRatio ?? null;

        const clamp = (v: number, min: number, max: number) =>
          Math.max(min, Math.min(v, max));

        switch (corner) {
          case 'br': {
            // expand to the right and bottom
            nw = clamp(sizeStart.w + gesture.dx, MIN_SIZE, imageWidth - sizeStart.x);
            nh = ratio ? nw / ratio : clamp(sizeStart.h + gesture.dy, MIN_SIZE, imageHeight - sizeStart.y);
            if (ratio) {
              nh = clamp(nh, MIN_SIZE, imageHeight - sizeStart.y);
              nw = nh * ratio;
            }
            break;
          }
          case 'bl': {
            // expand to the left and bottom
            nx = clamp(sizeStart.x + gesture.dx, 0, sizeStart.x + sizeStart.w - MIN_SIZE);
            nw = clamp(sizeStart.w - (nx - sizeStart.x), MIN_SIZE, sizeStart.x + sizeStart.w);
            nh = ratio ? nw / ratio : clamp(sizeStart.h + gesture.dy, MIN_SIZE, imageHeight - sizeStart.y);
            if (ratio) {
              nh = clamp(nh, MIN_SIZE, imageHeight - sizeStart.y);
              nw = nh * ratio;
              nx = clamp(sizeStart.x + (sizeStart.w - nw), 0, imageWidth - nw);
            }
            break;
          }
          case 'tr': {
            // expand to the right and top
            ny = clamp(sizeStart.y + gesture.dy, 0, sizeStart.y + sizeStart.h - MIN_SIZE);
            nh = clamp(sizeStart.h - (ny - sizeStart.y), MIN_SIZE, sizeStart.y + sizeStart.h);
            nw = ratio ? nh * ratio : clamp(sizeStart.w + gesture.dx, MIN_SIZE, imageWidth - sizeStart.x);
            if (ratio) {
              nw = clamp(nw, MIN_SIZE, imageWidth - sizeStart.x);
              nh = nw / ratio;
              ny = clamp(sizeStart.y + (sizeStart.h - nh), 0, imageHeight - nh);
            }
            break;
          }
          case 'tl': {
            // expand to the left and top
            nx = clamp(sizeStart.x + gesture.dx, 0, sizeStart.x + sizeStart.w - MIN_SIZE);
            ny = clamp(sizeStart.y + gesture.dy, 0, sizeStart.y + sizeStart.h - MIN_SIZE);
            nw = clamp(sizeStart.w - (nx - sizeStart.x), MIN_SIZE, sizeStart.x + sizeStart.w);
            nh = ratio ? nw / ratio : clamp(sizeStart.h - (ny - sizeStart.y), MIN_SIZE, sizeStart.y + sizeStart.h);
            if (ratio) {
              nh = clamp(nh, MIN_SIZE, imageHeight - ny);
              nw = nh * ratio;
              // reposition x to keep bottom-right fixed
              nx = clamp(sizeStart.x + (sizeStart.w - nw), 0, imageWidth - nw);
              ny = clamp(sizeStart.y + (sizeStart.h - nh), 0, imageHeight - nh);
            }
            break;
          }
        }

        // Final clamping within bounds
        nx = clamp(nx, 0, imageWidth - nw);
        ny = clamp(ny, 0, imageHeight - nh);

        cropX.value = nx;
        cropY.value = ny;
        cropWidth.value = nw;
        cropHeight.value = nh;
      },
      onPanResponderRelease: () => {
        updateCropData();
      },
    });

  const tlResponder = useRef(createCornerResponder('tl')).current;
  const trResponder = useRef(createCornerResponder('tr')).current;
  const blResponder = useRef(createCornerResponder('bl')).current;
  const brResponder = useRef(createCornerResponder('br')).current;

  return (
    <View style={styles.container}>
      {/* Image with Crop Overlay */}
      <View style={styles.cropContainer}>
        {/* Stage wrapper sized to the display dimensions for accurate overlay math */}
        <View style={[styles.stage, { width: imageWidth, height: imageHeight }]}>
          {/* Background Image */}
          <Image
            source={{ uri: imageUri }}
            style={StyleSheet.absoluteFillObject}
            resizeMode="contain"
          />

          {/* Dim areas outside crop */}
          <Animated.View
            style={[styles.dimPiece, topDimStyle]}
            pointerEvents="none"
          />
          <Animated.View
            style={[styles.dimPiece, leftDimStyle]}
            pointerEvents="none"
          />
          <Animated.View
            style={[styles.dimPiece, rightDimStyle]}
            pointerEvents="none"
          />
          <Animated.View
            style={[styles.dimPiece, bottomDimStyle]}
            pointerEvents="none"
          />

          {/* Crop Overlay */}
          <Animated.View
            style={[styles.cropOverlay, cropOverlayStyle]}
            {...dragResponder.panHandlers}
          >
          {/* Crop frame */}
          <View style={[styles.cropFrame, { borderColor: colors.primary }]}>
            {/* Grid lines */}
            <View style={styles.gridContainer}>
              <View
                style={[
                  styles.gridLine,
                  styles.gridLineVertical1,
                  { backgroundColor: colors.primary },
                ]}
              />
              <View
                style={[
                  styles.gridLine,
                  styles.gridLineVertical2,
                  { backgroundColor: colors.primary },
                ]}
              />
              <View
                style={[
                  styles.gridLine,
                  styles.gridLineHorizontal1,
                  { backgroundColor: colors.primary },
                ]}
              />
              <View
                style={[
                  styles.gridLine,
                  styles.gridLineHorizontal2,
                  { backgroundColor: colors.primary },
                ]}
              />
            </View>

            {/* Corner handles */}
            <View
              style={[
                styles.cornerHandle,
                styles.topLeft,
                { borderColor: colors.primary },
              ]}
              {...tlResponder.panHandlers}
            />
            <View
              style={[
                styles.cornerHandle,
                styles.topRight,
                { borderColor: colors.primary },
              ]}
              {...trResponder.panHandlers}
            />
            <View
              style={[
                styles.cornerHandle,
                styles.bottomLeft,
                { borderColor: colors.primary },
              ]}
              {...blResponder.panHandlers}
            />
            <View
              style={[
                styles.cornerHandle,
                styles.bottomRight,
                { borderColor: colors.primary },
              ]}
              {...brResponder.panHandlers}
            />
          </View>
          </Animated.View>
        </View>
      </View>

      {/* Controls */}
      <View
        style={[styles.controlsContainer, { backgroundColor: colors.surface }]}
      >
        <Text style={[styles.toolTitle, { color: colors.onBackground }]}>
          Crop & Resize
        </Text>

        {/* Aspect Ratio Buttons */}
        <View style={styles.aspectRatioContainer}>
          <Text style={[styles.sectionLabel, { color: colors.onSurface }]}>
            Aspect Ratio
          </Text>
          <View style={styles.aspectRatioButtons}>
            {ASPECT_RATIOS.map(item => (
              <TouchableOpacity
                key={item.label}
                style={[
                  styles.aspectRatioButton,
                  { backgroundColor: colors.background },
                  selectedAspectRatio === item.ratio && {
                    backgroundColor: colors.primary,
                  },
                ]}
                onPress={() => handleAspectRatioSelect(item.ratio)}
              >
                <Text
                  style={[
                    styles.aspectRatioText,
                    { color: colors.onBackground },
                    selectedAspectRatio === item.ratio && {
                      color: colors.onPrimary,
                    },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
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
                Apply Crop
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
  cropContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
  },
  stage: {
    position: 'relative',
    overflow: 'hidden',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  dimPiece: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  cropOverlay: {
    position: 'absolute',
  },
  cropFrame: {
    flex: 1,
    borderWidth: 2,
    borderStyle: 'solid',
  },
  gridContainer: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    opacity: 0.5,
  },
  gridLineVertical1: {
    left: '33.33%',
    top: 0,
    bottom: 0,
    width: 1,
  },
  gridLineVertical2: {
    left: '66.66%',
    top: 0,
    bottom: 0,
    width: 1,
  },
  gridLineHorizontal1: {
    top: '33.33%',
    left: 0,
    right: 0,
    height: 1,
  },
  gridLineHorizontal2: {
    top: '66.66%',
    left: 0,
    right: 0,
    height: 1,
  },
  cornerHandle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderWidth: 3,
    backgroundColor: 'white',
  },
  topLeft: {
    top: -10,
    left: -10,
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  topRight: {
    top: -10,
    right: -10,
    borderBottomWidth: 0,
    borderLeftWidth: 0,
  },
  bottomLeft: {
    bottom: -10,
    left: -10,
    borderTopWidth: 0,
    borderRightWidth: 0,
  },
  bottomRight: {
    bottom: -10,
    right: -10,
    borderTopWidth: 0,
    borderLeftWidth: 0,
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
  aspectRatioContainer: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    ...TYPOGRAPHY.body2,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  aspectRatioButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  aspectRatioButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  aspectRatioText: {
    ...TYPOGRAPHY.body2,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
