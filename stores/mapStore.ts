import { create } from 'zustand';
import type { MapPoint } from '@/types/app.types';

type MapViewMode = 'pins' | 'heatmap';

interface MapState {
  points: MapPoint[];
  viewMode: MapViewMode;
  selectedPointId: string | null;
  isCreating: boolean;
  viewingFriendId: string | null;
  viewingFriendName: string | null;

  setPoints: (points: MapPoint[]) => void;
  addPoint: (point: MapPoint) => void;
  updatePoint: (id: string, updates: Partial<MapPoint>) => void;
  removePoint: (id: string) => void;
  setViewMode: (mode: MapViewMode) => void;
  setSelectedPointId: (id: string | null) => void;
  setIsCreating: (creating: boolean) => void;
  setViewingFriend: (id: string | null, name?: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  points: [],
  viewMode: 'pins',
  selectedPointId: null,
  isCreating: false,
  viewingFriendId: null,
  viewingFriendName: null,

  setPoints: (points) => set({ points }),

  addPoint: (point) =>
    set((state) => ({ points: [...state.points, point] })),

  updatePoint: (id, updates) =>
    set((state) => ({
      points: state.points.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  removePoint: (id) =>
    set((state) => ({ points: state.points.filter((p) => p.id !== id) })),

  setViewMode: (viewMode) => set({ viewMode }),

  setSelectedPointId: (selectedPointId) => set({ selectedPointId }),

  setIsCreating: (isCreating) => set({ isCreating }),

  setViewingFriend: (id, name) => set({ viewingFriendId: id, viewingFriendName: name ?? null }),
}));
