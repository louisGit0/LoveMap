// Ce fichier est généré automatiquement par : npm run supabase:types
// Ne pas modifier manuellement — regénérer après chaque migration

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';
export type ConsentStatus = 'pending' | 'accepted' | 'rejected';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          date_of_birth: string;
          push_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          date_of_birth: string;
          push_token?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      points: {
        Row: {
          id: string;
          creator_id: string;
          // PostGIS geometry — retourné comme GeoJSON par Supabase
          location: { type: 'Point'; coordinates: [number, number] };
          note: number;
          comment: string | null;
          duration_minutes: number | null;
          happened_at: string;
          is_visible: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          location: { type: 'Point'; coordinates: [number, number] };
          note: number;
          comment?: string | null;
          duration_minutes?: number | null;
          happened_at?: string;
          is_visible?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['points']['Insert']>;
      };
      point_partners: {
        Row: {
          id: string;
          point_id: string;
          partner_id: string;
          status: ConsentStatus;
          notified_at: string;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          point_id: string;
          partner_id: string;
          status?: ConsentStatus;
          notified_at?: string;
          responded_at?: string | null;
        };
        Update: Partial<Database['public']['Tables']['point_partners']['Insert']>;
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: FriendshipStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: FriendshipStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['friendships']['Insert']>;
      };
    };
  };
}
