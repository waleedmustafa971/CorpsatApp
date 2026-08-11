import { areaInAcres } from '../lib/geo';
import { delay, riskLevelOf, samePhone, uid } from '../lib/util';
import { Farm, Farmer, FarmerSession, NewFarmInput, Snapshot } from '../types';
import { COMPANY_ID, snapshotsForNewlyActiveFarm } from './seed';
import { clearSession, loadStore, mutate, readSession, resetStore, writeSession } from './store';

/**
 * Mock service layer. Every function is async with a short delay so the UI has
 * the same loading behaviour it will have against a real backend.
 *
 * When the shared backend lands (MOBILE_APP.md §12) this file is the only one
 * that changes — the signatures below are the contract.
 */

const NETWORK_MS = 380;

export class ApiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = 'ApiError';
  }
}

/* ------------------------------------------------------------------ *
 * Auth
 * ------------------------------------------------------------------ */

let session: FarmerSession | null = null;
let sessionHydrated = false;

/** Restores a persisted session on app launch. */
export async function hydrateSession(): Promise<FarmerSession | null> {
  if (sessionHydrated) return session;
  session = await readSession();
  sessionHydrated = true;
  return session;
}

export function getSession(): FarmerSession | null {
  return session;
}

async function findFarmerByPhone(phone: string): Promise<Farmer | undefined> {
  const store = await loadStore();
  return store.farmers.find((farmer) => samePhone(farmer.phone, phone));
}

export async function requestOtp(phone: string): Promise<{ sent: boolean }> {
  await delay(NETWORK_MS);
  const farmer = await findFarmerByPhone(phone);
  if (!farmer) {
    throw new ApiError(
      'not_registered',
      "This number isn't registered. Ask your insurer to add you.",
    );
  }
  if (!farmer.canLogin) {
    throw new ApiError(
      'login_disabled',
      'App access is switched off for this number. Ask your insurer to enable it.',
    );
  }
  return { sent: true };
}

export async function verifyOtp(phone: string, code: string): Promise<FarmerSession> {
  await delay(NETWORK_MS);
  if (!code.trim()) {
    throw new ApiError('invalid_code', 'Enter the code we sent you.');
  }
  const farmer = await findFarmerByPhone(phone);
  if (!farmer || !farmer.canLogin) {
    throw new ApiError('not_registered', "This number isn't registered.");
  }
  // Mock: any non-empty code is accepted.
  const next: FarmerSession = {
    farmer,
    token: uid('tok'),
    expiresAt: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  };
  session = next;
  sessionHydrated = true;
  await writeSession(next);
  return next;
}

export async function logout(): Promise<void> {
  session = null;
  sessionHydrated = true;
  await clearSession();
}

function requireSession(): FarmerSession {
  if (!session) throw new ApiError('unauthenticated', 'Please sign in again.');
  return session;
}

/** Re-reads the farmer record from the store (e.g. after a reset). */
export async function refreshFarmer(): Promise<Farmer | null> {
  if (!session) return null;
  const store = await loadStore();
  const farmer = store.farmers.find((f) => f.id === session!.farmer.id);
  if (!farmer) return null;
  session = { ...session, farmer };
  await writeSession(session);
  return farmer;
}

/* ------------------------------------------------------------------ *
 * Data — all scoped to the logged-in farmer
 * ------------------------------------------------------------------ */

export async function getMyFarms(): Promise<Farm[]> {
  await delay(NETWORK_MS);
  const current = requireSession();
  const store = await loadStore();
  return store.farms
    .filter((farm) => farm.farmerIds.includes(current.farmer.id))
    .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
}

export async function getFarm(id: string): Promise<Farm | null> {
  await delay(NETWORK_MS);
  const current = requireSession();
  const store = await loadStore();
  const farm = store.farms.find((f) => f.id === id);
  if (!farm) return null;
  // A farmer only ever sees their own farms.
  if (!farm.farmerIds.includes(current.farmer.id)) return null;
  return farm;
}

export async function getSnapshots(farmId: string): Promise<Snapshot[]> {
  await delay(NETWORK_MS);
  const store = await loadStore();
  return store.snapshots
    .filter((snapshot) => snapshot.farmId === farmId)
    .sort((a, b) => new Date(a.captureDate).getTime() - new Date(b.captureDate).getTime());
}

/**
 * Latest NDVI per farm, for the health chips on the list screen. Additive
 * convenience over `getSnapshots` — one call instead of one per card.
 */
export async function getLatestNdvi(farmIds: string[]): Promise<Record<string, number>> {
  const store = await loadStore();
  const latest: Record<string, { ndvi: number; at: number }> = {};
  for (const snapshot of store.snapshots) {
    if (!farmIds.includes(snapshot.farmId)) continue;
    const at = new Date(snapshot.captureDate).getTime();
    if (!latest[snapshot.farmId] || at > latest[snapshot.farmId].at) {
      latest[snapshot.farmId] = { ndvi: snapshot.indices.ndvi, at };
    }
  }
  return Object.fromEntries(
    Object.entries(latest).map(([farmId, value]) => [farmId, value.ndvi]),
  );
}

export async function createFarmSubmission(input: NewFarmInput): Promise<Farm> {
  await delay(NETWORK_MS + 220);
  const current = requireSession();
  if (input.boundary.length < 3) {
    throw new ApiError('invalid_boundary', 'A field boundary needs at least 3 points.');
  }

  const now = new Date().toISOString();
  const id = uid('farm');
  const acres = input.landSizeAcres > 0 ? input.landSizeAcres : Number(areaInAcres(input.boundary).toFixed(1));
  // Same initial rating spread the admin panel's createFarm uses, so a farm
  // looks identical whichever side registered it.
  const rating = Number((0.2 + Math.random() * 0.25).toFixed(2));

  const farm: Farm = {
    id,
    name: input.name.trim(),
    boundary: input.boundary,
    landSizeAcres: acres,
    fieldAddress: `${input.state} agricultural scheme`,
    state: input.state,
    cropType: input.cropType,
    soilType: input.soilType,
    irrigationType: input.irrigationType,
    avgRiskRating: rating,
    riskLevel: riskLevelOf(rating),
    lastImageUpdate: now,
    companyId: COMPANY_ID,
    farmerIds: [input.farmerId || current.farmer.id],
    createdAt: now,
    status: 'submitted',
    source: input.source ?? 'app',
    submittedAt: now,
  };

  await mutate((store) => {
    store.farms.push(farm);
    const farmer = store.farmers.find((f) => f.id === farm.farmerIds[0]);
    if (farmer && !farmer.farmIds.includes(id)) farmer.farmIds.push(id);
  });

  await refreshFarmer();
  return farm;
}

/**
 * Dev-only. The real approval happens in the admin web panel — this exists so
 * the demo can show what the farmer sees once a manager approves a field.
 */
export async function mockApprove(farmId: string): Promise<Farm | null> {
  await delay(NETWORK_MS);
  return mutate((store) => {
    const farm = store.farms.find((f) => f.id === farmId);
    if (!farm || farm.status !== 'submitted') return null;
    farm.status = 'active';
    farm.reviewedAt = new Date().toISOString();
    farm.avgRiskRating = 0.31;
    farm.riskLevel = riskLevelOf(farm.avgRiskRating);
    const snapshots = snapshotsForNewlyActiveFarm(farm.id);
    farm.lastImageUpdate = snapshots[snapshots.length - 1]?.captureDate ?? farm.lastImageUpdate;
    store.snapshots.push(...snapshots);
    return farm;
  });
}

/** Re-seeds the local demo data (Profile → Reset demo data). */
export async function resetDemoData(): Promise<void> {
  await delay(NETWORK_MS);
  await resetStore();
  await refreshFarmer();
}
