import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { BlurView } from '@react-native-community/blur';

export type Rect = { x: number; y: number; width: number; height: number };

type Props = {
  uri: string;
  rect: Rect;
  intensity: number; // 0..100
  style?: any;
  canvasWidth?: number;
  canvasHeight?: number;
};

export const MaskedBlurPreview: React.FC<Props> = ({
  uri,
  rect,
  intensity,
  style,
  canvasWidth = 400,
  canvasHeight = 600,
}) => {
  // Calculate blur amount based on intensity - much more reasonable range
  const blurAmount = Math.max(1, (intensity / 100) * 25); // 1-25 blur amount

  return (
    <View style={[StyleSheet.absoluteFill, style]}>
      {/* Base image */}
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        resizeMode="contain"
      />

      {/* Blur overlay positioned over the selection rectangle */}
      <View
        style={[
          styles.blurContainer,
          {
            left: rect.x,
            top: rect.y,
            width: rect.width,
            height: rect.height,
          },
        ]}
      >
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType="light"
          blurAmount={blurAmount}
          reducedTransparencyFallbackColor="transparent"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    position: 'absolute',
    overflow: 'hidden',
  },
});
