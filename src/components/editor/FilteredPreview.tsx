import React from 'react';
import { Image, StyleSheet } from 'react-native';
import {
  GaussianBlur as GaussianBlurRaw,
  Sepia as SepiaRaw,
  Invert as InvertRaw,
  Saturate as SaturateRaw,
  Brightness as BrightnessRaw,
  Contrast as ContrastRaw,
} from 'react-native-image-filter-kit';

const GaussianBlur: any = GaussianBlurRaw;
const Sepia: any = SepiaRaw;
const Invert: any = InvertRaw;
const Saturate: any = SaturateRaw;
const Brightness: any = BrightnessRaw;
const Contrast: any = ContrastRaw;

type Props = {
  uri: string;
  filterId: string;
  intensity: number; // 0..100
  style?: any;
};

export const FilteredPreview: React.FC<Props> = ({
  uri,
  filterId,
  intensity,
  style,
}) => {
  const base = (
    <Image
      source={{ uri }}
      style={[StyleSheet.absoluteFill, style]}
      resizeMode="contain"
    />
  );

  const getFilteredImage = () => {
    const normalizedIntensity = intensity / 100;

    switch (filterId) {
      case 'blur':
        return <GaussianBlur radius={intensity * 0.2} image={base} />;
      case 'sepia':
        return <Sepia amount={normalizedIntensity} image={base} />;
      case 'invert':
        return <Invert image={base} />;
      case 'saturate':
        return <Saturate amount={1 + normalizedIntensity} image={base} />;
      case 'brightness':
        return (
          <Brightness amount={0.5 + normalizedIntensity * 0.5} image={base} />
        );
      case 'contrast':
        return (
          <Contrast amount={0.5 + normalizedIntensity * 1.5} image={base} />
        );
      default:
        return base;
    }
  };

  return getFilteredImage();
};
