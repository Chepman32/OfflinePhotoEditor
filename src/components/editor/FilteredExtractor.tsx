import React from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'react-native';
import {
  GaussianBlur as GaussianBlurRaw,
  Sepia as SepiaRaw,
  Invert as InvertRaw,
  Saturate as SaturateRaw,
  Brightness as BrightnessRaw,
  Contrast as ContrastRaw,
  ImageFilterProps,
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
  onDone: (uri: string) => void;
  onError?: (message: string) => void;
};

export const FilteredExtractor: React.FC<Props> = ({
  uri,
  filterId,
  intensity,
  onDone,
  onError,
}) => {
  const base = (
    <Image
      source={{ uri }}
      style={StyleSheet.absoluteFill}
      resizeMode="contain"
    />
  );

  const getFilteredImage = (): React.ReactElement<ImageFilterProps<any>> => {
    const normalizedIntensity = intensity / 100;

    switch (filterId) {
      case 'blur':
        return (<GaussianBlur radius={intensity * 0.2} image={base} />) as any;
      case 'sepia':
        return (<Sepia amount={normalizedIntensity} image={base} />) as any;
      case 'invert':
        return (<Invert image={base} />) as any;
      case 'saturate':
        return (
          <Saturate amount={1 + normalizedIntensity} image={base} />
        ) as any;
      case 'brightness':
        return (
          <Brightness amount={0.5 + normalizedIntensity * 0.5} image={base} />
        ) as any;
      case 'contrast':
        return (
          <Contrast amount={0.5 + normalizedIntensity * 1.5} image={base} />
        ) as any;
      default:
        return base as any;
    }
  };

  const filteredImage = getFilteredImage();

  return React.cloneElement(filteredImage, {
    style: [StyleSheet.absoluteFill, styles.hidden],
    extractImageEnabled: true,
    onFilteringError: (e: any) =>
      onError?.(e?.nativeEvent?.message ?? 'Filtering error'),
    onExtractImage: (e: any) => onDone(e?.nativeEvent?.uri),
  });
};

const styles = StyleSheet.create({
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    left: -1000,
    top: -1000,
  },
});
