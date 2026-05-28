import React, { useMemo } from 'react';
import MapboxGL from '@rnmapbox/maps';
import type { MapPoint } from '@/types/app.types';

interface Props {
  points: MapPoint[];
}

export function HeatmapLayer({ points }: Props) {
  const geojson = useMemo(
    () => ({
      type: 'FeatureCollection' as const,
      features: points.map((p) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [p.longitude, p.latitude],
        },
        properties: {
          weight: p.note / 10,
        },
      })),
    }),
    [points],
  );

  if (points.length === 0) return null;

  return (
    <MapboxGL.ShapeSource id="heatmap-source" shape={geojson}>
      <MapboxGL.HeatmapLayer
        id="heatmap-layer"
        sourceID="heatmap-source"
        style={{
          heatmapColor: [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.15, 'rgba(156,39,176,0.6)',
            0.5, '#e91e8c',
            1.0, '#ff5722',
          ],
          heatmapRadius: [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 20,
            14, 40,
            18, 60,
          ],
          heatmapOpacity: 0.85,
          heatmapWeight: ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
          heatmapIntensity: ['interpolate', ['linear'], ['zoom'], 10, 0.8, 14, 1.5],
        } as any}
      />
    </MapboxGL.ShapeSource>
  );
}
