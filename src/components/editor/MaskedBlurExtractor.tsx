import React from 'react';
import { StyleSheet } from 'react-native';
import { Image } from 'react-native';
import {
  GaussianBlur as GaussianBlurRaw,
  DstInComposition as DstInCompositionRaw,
  SrcOverComposition as SrcOverCompositionRaw,
  PathShape as PathShapeRaw,
  ImageFilterProps,
} from 'react-native-image-filter-kit';

const GaussianBlur: any = GaussianBlurRaw;
const DstInComposition: any = DstInCompositionRaw;
const SrcOverComposition: any = SrcOverCompositionRaw;
const PathShape: any = PathShapeRaw;

export type Rect = { x: number; y: number; width: number; height: number };

type Props = {
  uri: string;
  rect: Rect;
  intensity: number; // 0..100
  onDone: (uri: string) => void;
  onError?: (message: string) => void;
};

const rectPath = (w: number, h: number) => [
  { moveTo: [0, 0] },
  { lineTo: [w, 0] },
  { lineTo: [w, h] },
  { lineTo: [0, h] },
  { closePath: [] },
];

const blurRadius = (pct: number) => Math.max(0, Math.min(100, pct)) * 0.2; // 0..20px

export const MaskedBlurExtractor: React.FC<Props> = ({ uri, rect, intensity, onDone, onError }) => {
  const base = (
    <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
  );

  const blurred = <GaussianBlur radius={blurRadius(intensity)} image={base} />;
  const mask = (
    <PathShape
      path={rectPath(rect.width, rect.height)}
      color="#FFFFFF"
      transform={{ translate: { x: rect.x, y: rect.y } }}
    />
  );
  const maskedBlur = (
    <DstInComposition resizeCanvasTo="dstImage" dstImage={blurred} srcImage={mask} />
  );

  const finalTree: React.ReactElement<ImageFilterProps<any>> = (
    <SrcOverComposition
      style={[StyleSheet.absoluteFill, styles.hidden]}
      resizeCanvasTo="dstImage"
      dstImage={base}
      srcImage={maskedBlur}
    />
  ) as any;

  return React.cloneElement(finalTree, {
    extractImageEnabled: true,
    onFilteringError: (e: any) => onError?.(e?.nativeEvent?.message ?? 'Filtering error'),
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
