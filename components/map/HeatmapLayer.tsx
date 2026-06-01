import React, { useMemo } from 'react';
import MapboxGL from '@rnmapbox/maps';
import { MAP_COLORS } from '@/constants/config';
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
          // Dégradé braise rose→ambre sur la densité (D-08). Premier stop transparent
          // OBLIGATOIRE (sinon toute la carte se teinte — RESEARCH Unknown #2).
          heatmapColor: [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0.0, 'rgba(0,0,0,0)',
            0.1, 'rgba(255,45,135,0.15)',
            0.3, 'rgba(255,45,135,0.55)',
            0.5, '#ff5a7a',
            0.7, '#ff8a4c',
            0.9, MAP_COLORS.emberAmber,
            1.0, MAP_COLORS.emberGold,
          ],
          heatmapRadius: [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 22,
            14, 44,
            18, 70,
          ],
          // Opacité décroissante au zoom proche → lueur douce (D-09).
          heatmapOpacity: [
            'interpolate',
            ['linear'],
            ['zoom'],
            10, 0.85,
            13, 0.80,
            15, 0.55,
            17, 0.35,
            19, 0.25,
          ],
          heatmapWeight: ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
          heatmapIntensity: ['interpolate', ['linear'], ['zoom'], 10, 0.8, 14, 1.4],
        } as any}
      />
    </MapboxGL.ShapeSource>
  );
}
