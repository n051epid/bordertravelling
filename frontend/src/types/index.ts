export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export interface Journey {
  id: string;
  user_id: string;
  title: string;
  route: 'G219' | 'G331' | 'G228';
  status: 'active' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Photo {
  id: string;
  journey_id: string;
  url: string;
  latitude: number | null;
  longitude: number | null;
  verified: boolean;
  gps_verified: boolean;
  created_at: string;
}

export interface TrackPoint {
  latitude: number;
  longitude: number;
  timestamp?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
