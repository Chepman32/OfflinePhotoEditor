import React from 'react';
import { Image, StyleSheet } from 'react-native';
import {
  GaussianBlur as GaussianBlurRaw,
  DstInComposition as DstInCompositionRaw,
  SrcOverComposition as SrcOverCompositionRaw,
  PathShape as PathShapeRaw,
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
  style?: any;
};

const rectPath = (w: number, h: number) => [
  { moveTo: [0, 0] },
  { lineTo: [w, 0] },
  { lineTo: [w, h] },
  { lineTo: [0, h] },
  { closePath: [] },
];

const blurRadius = (pct: number) => Math.max(0, Math.min(100, pct)) * 0.2; // 0..20px

export const MaskedBlurPreview: React.FC<Props> = ({ uri, rect, intensity, style }) => {
  const base = (
    <Image source={{ uri }} style={[StyleSheet.absoluteFill, style]} resizeMode="contain" />
  );

  const blurred = <GaussianBlur radius={blurRadius(intensity)} image={base} />;
  const mask = (
    <PathShape
      path={rectPath(rect.width, rect.height)}
      color="#FFFFFF"
      // place mask at rect.x, rect.y
      transform={{ translate: { x: rect.x, y: rect.y } }}
    />
  );

  const maskedBlur = (
    <DstInComposition
      resizeCanvasTo="dstImage"
      dstImage={blurred}
      srcImage={mask}
    />
  );

  return (
    <SrcOverComposition
      style={[StyleSheet.absoluteFill, style]}
      resizeCanvasTo="dstImage"
      dstImage={base}
      srcImage={maskedBlur}
    />
  );
};

