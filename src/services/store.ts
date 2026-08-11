import AsyncStorage from '@react-native-async-storage/async-storage';

import { FarmerSession } from '../types';
import { buildSeed, StoreShape, STORE_VERSION } from './seed';

export const STORE_KEY = `cropsat.mobile.store.v${STORE_VERSION}`;
export const SESSION_KEY = `cropsat.mobile.session.v${STORE_VERSION}`;

let cache: StoreShape | null = null;
let loading: Promise<StoreShape> | null = null;

/** Loads the persisted store, seeding it on first launch. */
export async function loadStore(): Promise<StoreShape> {
  if (cache) return cache;
  if (loading) return loading;

  loading = (async () => {
    try {
      const raw = await AsyncStorage.getItem(STORE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoreShape;
        if (parsed && parsed.version === STORE_VERSION && Array.isArray(parsed.farms)) {
          cache = parsed;
          return parsed;
        }
      }
    } catch {
      // Corrupt or unreadable storage falls through to a fresh seed.
    }
    const seeded = buildSeed();
    cache = seeded;
    await persist();
    return seeded;
  })();

  try {
    return await loading;
  } finally {
    loading = null;
  }
}

/** Writes the in-memory store back to AsyncStorage. */
export async function persist(): Promise<void> {
  if (!cache) return;
  try {
    await AsyncStorage.setItem(STORE_KEY, JSON.stringify(cache));
  } catch {
    // Persistence is best-effort in the mock environment.
  }
}

/** Mutates the store and persists in one step. */
export async function mutate<T>(fn: (store: StoreShape) => T): Promise<T> {
  const store = await loadStore();
  const result = fn(store);
  await persist();
  return result;
}

/** Wipes everything and re-seeds — the Profile screen's "Reset demo data". */
export async function resetStore(): Promise<StoreShape> {
  cache = buildSeed();
  await persist();
  return cache;
}

/* ------------------------------------------------------------------ *
 * Session persistence
 * ------------------------------------------------------------------ */

export async function readSession(): Promise<FarmerSession | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as FarmerSession;
    if (!session?.farmer?.id) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      await AsyncStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function writeSession(session: FarmerSession): Promise<void> {
  try {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
}

export async function clearSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
