import type { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Point = Database['public']['Tables']['points']['Row'];
export type PointPartner = Database['public']['Tables']['point_partners']['Row'];
export type Friendship = Database['public']['Tables']['friendships']['Row'];

// Point avec coordonnées déjà extraites pour react-native-maps
export interface MapPoint extends Omit<Point, 'location'> {
  latitude: number;
  longitude: number;
  partnerUsername?: string;
  partnerDisplayName?: string;
}

// Amitié enrichie avec le profil de l'autre utilisateur
export interface FriendWithProfile extends Friendship {
  profile: Profile;
}
