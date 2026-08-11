/**
 * Shared domain types.
 *
 * These mirror the Cropsat admin web panel's `types.ts` field-for-field so the
 * future shared backend (see MOBILE_APP.md §12) is a drop-in swap.
 */

export type CropType = 'Cotton' | 'Wheat' | 'Sorghum';
export type SoilType = 'Sandy Qoz' | 'Clay' | 'Loam';
export type IrrigationType = 'Drip' | 'Sprinkler' | 'Flood' | 'Rainfed';
export type RiskLevel = 'Low' | 'Moderate' | 'High';
export type HealthClass = 'Danger' | 'Distress' | 'Health';
export type FarmStatus = 'submitted' | 'active' | 'rejected';
export type FarmSource = 'web' | 'app';

/**
 * IMPORTANT: coordinates are stored as [longitude, latitude] (NOT [lat, lng]).
 * react-native-maps speaks `{ latitude, longitude }` — convert at the boundary
 * with `toRegionPoints` / `toBoundary` in `src/lib/geo.ts`.
 */
export type LatLng = [number, number];

export interface Farmer {
  id: string;
  name: string;
  phone: string; // E.164-ish, e.g. "+249 900 000 000" — the login identifier
  email: string;
  address: string;
  country: string; // "Sudan"
  state: string; // "Gedaref" | "Sennar" | "Khartoum"
  canLogin: boolean; // must be true to log in via the app
  companyId: string;
  farmIds: string[];
  createdAt: string; // ISO
}

export interface Farm {
  id: string;
  name: string;
  boundary: LatLng[]; // polygon, [lon,lat] points, >= 3
  landSizeAcres: number;
  fieldAddress: string;
  state: string;
  cropType: CropType;
  soilType: SoilType;
  irrigationType: IrrigationType;
  avgRiskRating: number; // 0..1
  riskLevel: RiskLevel;
  lastImageUpdate: string;
  companyId: string;
  farmerIds: string[];
  createdAt: string;
  status: FarmStatus;
  source: FarmSource;
  submittedAt: string;
  reviewedAt?: string;
  reviewNote?: string;
}

export interface SnapshotIndices {
  ndvi: number;
  ndwi: number;
  ndre: number;
  soil: number;
}

export interface Snapshot {
  id: string;
  farmId: string;
  captureDate: string;
  indices: SnapshotIndices;
  healthClass: HealthClass;
  source: 'Planet' | 'Sentinel-2';
}

/** The payload the farmer submits (matches the web app's NewFarmInput). */
export interface NewFarmInput {
  name: string;
  boundary: LatLng[];
  landSizeAcres: number;
  state: string;
  cropType: CropType;
  soilType: SoilType;
  irrigationType: IrrigationType;
  farmerId: string;
  source?: FarmSource; // set to "app" from the mobile app
}

export interface FarmerSession {
  farmer: Farmer;
  token: string;
  expiresAt: string;
}

/** Option lists shared by the seed data and the Add Farm form pickers. */
export const CROP_TYPES: CropType[] = ['Cotton', 'Wheat', 'Sorghum'];
export const SOIL_TYPES: SoilType[] = ['Sandy Qoz', 'Clay', 'Loam'];
export const IRRIGATION_TYPES: IrrigationType[] = ['Drip', 'Sprinkler', 'Flood', 'Rainfed'];
export const STATES = ['Gedaref', 'Sennar', 'Khartoum'] as const;
export type StateName = (typeof STATES)[number];

/** State centres in [longitude, latitude]. */
export const STATE_CENTERS: Record<StateName, LatLng> = {
  Gedaref: [35.38, 14.03],
  Sennar: [33.62, 13.55],
  Khartoum: [32.55, 15.5],
};
