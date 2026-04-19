export type User = {
  id: number;
  phone: string;
  username: string;
  createdAt: string;
};

export type AuthResponse = {
  token: string;
  user: User;
};

export type Photo = {
  id: number;
  userId: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  takenAt: string | null;
  locationName: string | null;
  createdAt: string;
};

export type Journey = {
  id: number;
  userId: number;
  routeId: number | null;
  title: string;
  description: string | null;
  startedAt: string | null;
  endedAt: string | null;
  status: 'planning' | 'active' | 'completed';
  createdAt: string;
  photos?: JourneyPhoto[];
};

export type JourneyPhoto = {
  id: number;
  journeyId: number;
  photoId: number;
  orderIndex: number;
  caption: string | null;
  addedAt: string;
};

export type BorderRoute = {
  id: number;
  name: string;
  routeNumber: string;
  country: string;
  description: string | null;
  totalLength: number | null;
  startPoint: string | null;
  endPoint: string | null;
};

export type ApiResponse<T> = {
  data?: T;
  error?: string;
  message?: string;
};
