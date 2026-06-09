export type UserRole = "buyer" | "seller" | "master" | "moderator" | "admin";

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
}

export interface Part {
  id: number;
  title: string;
  part_number: string | null;
  price: number;
  condition: "used" | "new";
  category: string;
  car: string;
  fits: string[];
  location: string;
  address: string | null;
  seller: string;
  phone: string | null;
  working_hours: string | null;
  verified: boolean;
  description: string | null;
  image_url: string | null;
  images?: string[] | null;
  attributes?: Record<string, string> | null;
}

export interface Master {
  id: number;
  name: string;
  spec: string;
  exp: string;
  rating: number;
  jobs: number;
  district: string;
  address: string | null;
  phone: string | null;
  telegram: string | null;
  working_hours: string | null;
  latitude: number | null;
  longitude: number | null;
  priceFrom: number;
  distance_km: number | null;
}

export interface Category {
  id: string;
  name: string;
  abbr: string;
}

export interface AppConfig {
  brand: string;
  whatsapp: string;
  telegram: string;
  city: string;
  return_days: number;
}

export interface BookingPayload {
  master_id: number;
  service: string;
  booking_date: string;
  booking_time: string;
  phone: string;
  problem?: string | null;
}

export interface SavedSearch {
  id: string;
  label: string;
  q?: string;
  category?: string;
  part_number?: string;
  car_fit?: string;
  createdAt: number;
}

export interface CabinetData {
  bookings: Array<{
    id: number;
    master_name: string;
    service: string;
    booking_date: string;
    booking_time: string;
    status: string;
  }>;
  repairs: Array<{
    id: number;
    title: string;
    master: string;
    cost: number;
    date: string;
    part?: string | null;
  }>;
}
