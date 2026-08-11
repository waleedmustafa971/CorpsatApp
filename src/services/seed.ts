import { polygonAround, areaInAcres } from '../lib/geo';
import { clamp, healthClassOf, riskLevelOf } from '../lib/util';
import { Farm, Farmer, LatLng, Snapshot, STATE_CENTERS } from '../types';

export interface StoreShape {
  version: number;
  farmers: Farmer[];
  farms: Farm[];
  snapshots: Snapshot[];
}

export const STORE_VERSION = 1;
export const COMPANY_ID = 'co_sudan_agri_insure';

/** The phone number the demo farmer signs in with. */
export const DEMO_PHONE = '+249 900 000 000';

function iso(daysAgo: number): string {
  return new Date(Date.now() - daysAgo * 86_400_000).toISOString();
}

/**
 * Seasonal NDVI curve from MOBILE_APP.md §7:
 *   ndvi = clamp(0.08 + 0.72 * sin(π * progress)^1.4 * healthFactor, 0.05, 0.9)
 */
function ndviAt(progress: number, healthFactor: number): number {
  const shape = Math.pow(Math.sin(Math.PI * progress), 1.4);
  return clamp(0.08 + 0.72 * shape * healthFactor, 0.05, 0.9);
}

function makeSnapshots(farmId: string, count: number, healthFactor: number, daySpacing = 12): Snapshot[] {
  const snapshots: Snapshot[] = [];
  for (let i = 0; i < count; i += 1) {
    // The captures cover the first two-thirds of the season, so the newest one
    // lands near peak greenness — what a mid-season field actually looks like.
    const progress = 0.12 + (i / Math.max(count - 1, 1)) * 0.5;
    const ndvi = Number(ndviAt(progress, healthFactor).toFixed(3));
    const ndwi = Number(clamp(ndvi * 0.62 + 0.05, 0.02, 0.75).toFixed(3));
    const ndre = Number(clamp(ndvi * 0.78 - 0.02, 0.02, 0.8).toFixed(3));
    const soil = Number(clamp(0.52 - ndvi * 0.35, 0.05, 0.6).toFixed(3));
    snapshots.push({
      id: `snap_${farmId}_${i}`,
      farmId,
      captureDate: iso((count - 1 - i) * daySpacing),
      indices: { ndvi, ndwi, ndre, soil },
      healthClass: healthClassOf(ndvi),
      source: i % 3 === 0 ? 'Planet' : 'Sentinel-2',
    });
  }
  return snapshots;
}

interface FarmSeed {
  id: string;
  name: string;
  center: LatLng;
  radiusDeg: number;
  points: number;
  state: string;
  fieldAddress: string;
  cropType: Farm['cropType'];
  soilType: Farm['soilType'];
  irrigationType: Farm['irrigationType'];
  avgRiskRating: number;
  status: Farm['status'];
  source: Farm['source'];
  submittedDaysAgo: number;
  reviewedDaysAgo?: number;
  reviewNote?: string;
  farmerId: string;
}

function buildFarm(seed: FarmSeed): Farm {
  const boundary = polygonAround(seed.center, seed.radiusDeg, seed.points);
  return {
    id: seed.id,
    name: seed.name,
    boundary,
    landSizeAcres: Number(areaInAcres(boundary).toFixed(1)),
    fieldAddress: seed.fieldAddress,
    state: seed.state,
    cropType: seed.cropType,
    soilType: seed.soilType,
    irrigationType: seed.irrigationType,
    avgRiskRating: seed.avgRiskRating,
    riskLevel: riskLevelOf(seed.avgRiskRating),
    lastImageUpdate: seed.status === 'active' ? iso(2) : iso(seed.submittedDaysAgo),
    companyId: COMPANY_ID,
    farmerIds: [seed.farmerId],
    createdAt: iso(seed.submittedDaysAgo),
    status: seed.status,
    source: seed.source,
    submittedAt: iso(seed.submittedDaysAgo),
    reviewedAt: seed.reviewedDaysAgo !== undefined ? iso(seed.reviewedDaysAgo) : undefined,
    reviewNote: seed.reviewNote,
  };
}

export function buildSeed(): StoreShape {
  const yousifId = 'farmer_yousif';
  const amnaId = 'farmer_amna';

  const farmSeeds: FarmSeed[] = [
    {
      id: 'farm_gedaref_north',
      name: 'North Gedaref Block',
      center: [STATE_CENTERS.Gedaref[0] + 0.03, STATE_CENTERS.Gedaref[1] + 0.025],
      radiusDeg: 0.0075,
      points: 6,
      state: 'Gedaref',
      fieldAddress: 'Al Faw road, 12 km north of Gedaref',
      cropType: 'Sorghum',
      soilType: 'Clay',
      irrigationType: 'Rainfed',
      avgRiskRating: 0.28,
      status: 'active',
      source: 'web',
      submittedDaysAgo: 132,
      reviewedDaysAgo: 128,
      farmerId: yousifId,
    },
    {
      id: 'farm_gedaref_wadi',
      name: 'Wadi El Hawad Field',
      center: [STATE_CENTERS.Gedaref[0] - 0.028, STATE_CENTERS.Gedaref[1] - 0.021],
      radiusDeg: 0.0045,
      points: 5,
      state: 'Gedaref',
      fieldAddress: 'Wadi El Hawad, east bank',
      cropType: 'Cotton',
      soilType: 'Sandy Qoz',
      irrigationType: 'Sprinkler',
      avgRiskRating: 0.51,
      status: 'submitted',
      source: 'app',
      submittedDaysAgo: 3,
      farmerId: yousifId,
    },
  ];

  const farms = farmSeeds.map(buildFarm);

  const snapshots: Snapshot[] = [
    // Only the approved farm is monitored — a submitted farm has no imagery yet.
    ...makeSnapshots('farm_gedaref_north', 9, 0.92),
  ];

  const yousif: Farmer = {
    id: yousifId,
    name: 'Yousif Ibrahim',
    phone: DEMO_PHONE,
    email: 'yousif.ibrahim@example.sd',
    address: 'Block 7, Gedaref town',
    country: 'Sudan',
    state: 'Gedaref',
    canLogin: true,
    companyId: COMPANY_ID,
    farmIds: farms.map((farm) => farm.id),
    createdAt: iso(140),
  };

  // Second farmer demonstrates a blocked login (canLogin: false).
  const amna: Farmer = {
    id: amnaId,
    name: 'Amna Hassan',
    phone: '+249 911 222 333',
    email: 'amna.hassan@example.sd',
    address: 'Sennar central',
    country: 'Sudan',
    state: 'Sennar',
    canLogin: false,
    companyId: COMPANY_ID,
    farmIds: [],
    createdAt: iso(90),
  };

  return {
    version: STORE_VERSION,
    farmers: [yousif, amna],
    farms,
    snapshots,
  };
}

/** Snapshots for a farm the manager has just approved — used by the dev-only approve action. */
export function snapshotsForNewlyActiveFarm(farmId: string): Snapshot[] {
  return makeSnapshots(farmId, 8, 0.8);
}
