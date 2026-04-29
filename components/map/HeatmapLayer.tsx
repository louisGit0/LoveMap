import React from 'react';
import { Heatmap } from 'react-native-maps';
import type { MapPoint } from '@/types/app.types';

interface Props {
  points: MapPoint[];
}

const gradient = {
  colors: ['#9c27b0', '#e91e8c', '#ff5722'],
  startPoints: [0.1, 0.5, 1.0],
  colorMapSize: 256,
};

export function HeatmapLayer({ points }: Props) {
  if (points.length === 0) return null;

  const heatmapPoints = points.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
    weight: p.note / 10,
  }));

  return <Heatmap points={heatmapPoints} gradient={gradient} radius={40} opacity={0.8} />;
}
