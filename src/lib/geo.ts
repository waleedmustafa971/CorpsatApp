import { LatLng } from '../types';

/**
 * The one place where the `[longitude, latitude]` model format meets
 * react-native-maps' `{ latitude, longitude }`. Everything else in the app
 * should use these helpers rather than indexing tuples by hand.
 */

export interface MapPoint {
  latitude: number;
  longitude: number;
}

export interface MapRegion extends MapPoint {
  latitudeDelta: number;
  longitudeDelta: number;
}

/** `[lon, lat]` → `{ latitude, longitude }`. */
export function toMapPoint(point: LatLng): MapPoint {
  return { longitude: point[0], latitude: point[1] };
}

/** `{ latitude, longitude }` → `[lon, lat]`. */
export function toLatLng(point: MapPoint): LatLng {
  return [point.longitude, point.latitude];
}

export function toMapPoints(boundary: LatLng[]): MapPoint[] {
  return boundary.map(toMapPoint);
}

export function toBoundary(points: MapPoint[]): LatLng[] {
  return points.map(toLatLng);
}

export interface Bounds {
  minLon: number;
  maxLon: number;
  minLat: number;
  maxLat: number;
}

export function boundsOf(boundary: LatLng[]): Bounds | null {
  if (boundary.length === 0) return null;
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of boundary) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return { minLon, maxLon, minLat, maxLat };
}

export function centroidOf(boundary: LatLng[]): LatLng | null {
  const bounds = boundsOf(boundary);
  if (!bounds) return null;
  return [(bounds.minLon + bounds.maxLon) / 2, (bounds.minLat + bounds.maxLat) / 2];
}

/** A camera region that frames the polygon with a little breathing room. */
export function regionForBoundary(boundary: LatLng[], padding = 1.6): MapRegion | null {
  const bounds = boundsOf(boundary);
  if (!bounds) return null;
  const latitudeDelta = Math.max((bounds.maxLat - bounds.minLat) * padding, 0.006);
  const longitudeDelta = Math.max((bounds.maxLon - bounds.minLon) * padding, 0.006);
  return {
    latitude: (bounds.minLat + bounds.maxLat) / 2,
    longitude: (bounds.minLon + bounds.maxLon) / 2,
    latitudeDelta,
    longitudeDelta,
  };
}

export function regionForCenter(center: LatLng, span = 0.06): MapRegion {
  return {
    longitude: center[0],
    latitude: center[1],
    latitudeDelta: span,
    longitudeDelta: span,
  };
}

const EARTH_RADIUS_M = 6_378_137;
const SQM_PER_ACRE = 4046.8564224;

/**
 * Spherical-excess-free approximation: project lon/lat to local metres around
 * the polygon centroid, then run the shoelace formula. Accurate to well under
 * a percent for field-sized polygons, which is all a farm boundary needs.
 */
export function areaInAcres(boundary: LatLng[]): number {
  if (boundary.length < 3) return 0;
  const centroid = centroidOf(boundary);
  if (!centroid) return 0;
  const [, centreLat] = centroid;
  const latRad = (centreLat * Math.PI) / 180;
  const metresPerDegLat = (Math.PI / 180) * EARTH_RADIUS_M;
  const metresPerDegLon = metresPerDegLat * Math.cos(latRad);

  const points = boundary.map(([lon, lat]) => ({
    x: lon * metresPerDegLon,
    y: lat * metresPerDegLat,
  }));

  let twiceArea = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    twiceArea += a.x * b.y - b.x * a.y;
  }
  return Math.abs(twiceArea / 2) / SQM_PER_ACRE;
}

/** Builds a slightly irregular field polygon around a centre — used by the seed. */
export function polygonAround(center: LatLng, radiusDeg: number, points: number, jitter = 0.28): LatLng[] {
  const [lon, lat] = center;
  const latScale = 1 / Math.max(Math.cos((lat * Math.PI) / 180), 0.2);
  const result: LatLng[] = [];
  for (let i = 0; i < points; i += 1) {
    const angle = (i / points) * Math.PI * 2;
    // Deterministic wobble so the seed looks organic but is stable across runs.
    const wobble = 1 + jitter * Math.sin(angle * 3 + i) * 0.5;
    const r = radiusDeg * wobble;
    result.push([
      Number((lon + Math.cos(angle) * r * latScale).toFixed(5)),
      Number((lat + Math.sin(angle) * r).toFixed(5)),
    ]);
  }
  return result;
}

/**
 * Parses the web app's manual-entry format: `lon,lat | lon,lat | …`
 * (also tolerates newlines and semicolons as separators).
 */
export function parseBoundaryText(text: string): { boundary: LatLng[]; error?: string } {
  const chunks = text
    .split(/[|;\n]/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (chunks.length === 0) return { boundary: [], error: 'Enter at least 3 points.' };

  const boundary: LatLng[] = [];
  for (const chunk of chunks) {
    const parts = chunk.split(',').map((part) => part.trim());
    if (parts.length !== 2) {
      return { boundary: [], error: `"${chunk}" is not a "lon,lat" pair.` };
    }
    const lon = Number(parts[0]);
    const lat = Number(parts[1]);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      return { boundary: [], error: `"${chunk}" is not a pair of numbers.` };
    }
    if (lon < -180 || lon > 180 || lat < -90 || lat > 90) {
      return { boundary: [], error: `"${chunk}" is out of range — remember it is lon,lat.` };
    }
    boundary.push([lon, lat]);
  }

  if (boundary.length < 3) return { boundary: [], error: 'A field needs at least 3 points.' };
  return { boundary };
}

export function boundaryToText(boundary: LatLng[]): string {
  return boundary.map(([lon, lat]) => `${lon.toFixed(5)},${lat.toFixed(5)}`).join(' | ');
}
