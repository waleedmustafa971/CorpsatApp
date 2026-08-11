import Constants from 'expo-constants';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  GestureResponderEvent,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import {
  MapPoint,
  boundsOf,
  centroidOf,
  regionForBoundary,
  regionForCenter,
  toLatLng,
  toMapPoints,
} from '../lib/geo';
import { colors, ink, onImagery, radius, space, type } from '../lib/theme';
import { LatLng } from '../types';

/**
 * react-native-maps is a native module. It is loaded lazily so the app still
 * renders (with the coordinate-grid fallback below) on web or anywhere the
 * native view is unavailable. Both paths speak the same `[lon, lat]` data flow.
 */
let Maps: any = null;
let moduleLoaded = false;
if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    Maps = require('react-native-maps');
    moduleLoaded = Boolean(Maps?.default);
  } catch {
    moduleLoaded = false;
  }
}

/**
 * Android renders through Google Maps, whose SDK throws a fatal
 * `RuntimeException: API key not found` as soon as a MapView is constructed if
 * the manifest carries no key. Expo Go supplies Expo's own key, but a
 * standalone build only has one when GOOGLE_MAPS_API_KEY was set at build time
 * (see app.config.js). Without it we must not mount a MapView at all — so the
 * fallback renders instead. iOS uses Apple Maps and needs no key.
 */
const androidKeyMissing =
  Platform.OS === 'android' && !Constants.expoConfig?.extra?.googleMapsConfigured;

const mapsAvailable = moduleLoaded && !androidKeyMissing;

export const NATIVE_MAPS_AVAILABLE = mapsAvailable;

export interface FarmMapProps {
  boundary: LatLng[];
  /** Fallback centre when the boundary is empty (e.g. the farmer's state). */
  center?: LatLng;
  /** Polygon fill — usually `ndviColor(latestNdvi)`. */
  fillColor?: string;
  strokeColor?: string;
  /** Enables tap-to-add-point. */
  editable?: boolean;
  onAddPoint?: (point: LatLng) => void;
  height?: number;
  /** Allows pan/zoom. Off for small preview maps inside cards. */
  interactive?: boolean;
  showVertices?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function FarmMap({
  boundary,
  center,
  fillColor = colors.accent,
  strokeColor,
  editable = false,
  onAddPoint,
  height = 220,
  interactive = true,
  showVertices = true,
  style,
  children,
}: FarmMapProps) {
  const stroke = strokeColor ?? fillColor;

  if (!mapsAvailable) {
    return (
      <FallbackMap
        boundary={boundary}
        center={center}
        fillColor={fillColor}
        strokeColor={stroke}
        editable={editable}
        onAddPoint={onAddPoint}
        height={height}
        interactive={interactive}
        showVertices={showVertices}
        style={style}
      >
        {children}
      </FallbackMap>
    );
  }

  return (
    <NativeMap
      boundary={boundary}
      center={center}
      fillColor={fillColor}
      strokeColor={stroke}
      editable={editable}
      onAddPoint={onAddPoint}
      height={height}
      interactive={interactive}
      showVertices={showVertices}
      style={style}
    >
      {children}
    </NativeMap>
  );
}

/* ------------------------------------------------------------------ *
 * Native (react-native-maps)
 * ------------------------------------------------------------------ */

function NativeMap({
  boundary,
  center,
  fillColor,
  strokeColor,
  editable,
  onAddPoint,
  height,
  interactive,
  showVertices,
  style,
  children,
}: Required<Pick<FarmMapProps, 'boundary' | 'fillColor' | 'strokeColor' | 'height'>> &
  FarmMapProps) {
  const MapView = Maps.default;
  const { Polygon, Marker } = Maps;
  const mapRef = useRef<any>(null);

  const initialRegion = useMemo(() => {
    return (
      regionForBoundary(boundary) ??
      regionForCenter(center ?? [32.55, 15.5], editable ? 0.05 : 0.03)
    );
    // Deliberately computed once — later changes are animated below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-frame the camera when a display map receives a different field.
  const framedFor = useRef<string>('');
  useEffect(() => {
    if (editable || boundary.length < 3) return;
    const key = JSON.stringify(boundary);
    if (framedFor.current === key) return;
    framedFor.current = key;
    const region = regionForBoundary(boundary);
    if (region) {
      // A tick of delay lets the map lay out before the camera moves.
      const timer = setTimeout(() => mapRef.current?.animateToRegion(region, 450), 120);
      return () => clearTimeout(timer);
    }
  }, [boundary, editable]);

  const coordinates = useMemo(() => toMapPoints(boundary), [boundary]);

  const handlePress = (event: { nativeEvent: { coordinate: MapPoint } }) => {
    if (!editable || !onAddPoint) return;
    onAddPoint(toLatLng(event.nativeEvent.coordinate));
  };

  return (
    <View style={[styles.container, { height }, style]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        mapType="hybrid"
        onPress={handlePress}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        showsUserLocation={editable}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {coordinates.length >= 3 ? (
          <Polygon
            coordinates={coordinates}
            fillColor={withAlpha(fillColor, 0.55)}
            strokeColor={strokeColor}
            strokeWidth={2.5}
          />
        ) : null}
        {showVertices && editable
          ? coordinates.map((coordinate: MapPoint, index: number) => (
              <Marker
                key={`${coordinate.latitude}-${coordinate.longitude}-${index}`}
                coordinate={coordinate}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={false}
              >
                <View style={styles.vertex}>
                  <Text style={styles.vertexLabel}>{index + 1}</Text>
                </View>
              </Marker>
            ))
          : null}
      </MapView>
      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * Fallback — a projected coordinate canvas with the same data flow
 * ------------------------------------------------------------------ */

function FallbackMap({
  boundary,
  center,
  fillColor,
  strokeColor,
  editable,
  onAddPoint,
  height,
  interactive = true,
  showVertices,
  style,
  children,
}: Required<Pick<FarmMapProps, 'boundary' | 'fillColor' | 'strokeColor' | 'height'>> &
  FarmMapProps) {
  const [width, setWidth] = useState(0);
  const [zoom, setZoom] = useState(1);
  const surfaceRef = useRef<View>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);

  // While drawing, the view stays pinned to the requested centre — re-framing
  // on every tap would slide the points the farmer just placed.
  const [editFocus, setEditFocus] = useState<LatLng>(center ?? [32.55, 15.5]);
  useEffect(() => {
    if (center) setEditFocus(center);
  }, [center]);

  const displayFocus = useMemo<LatLng>(
    () => centroidOf(boundary) ?? center ?? [32.55, 15.5],
    [boundary, center],
  );
  const focus = editable ? editFocus : displayFocus;
  const aspect = width > 0 ? width / height : 1;
  const cosLat = Math.max(Math.cos((focus[1] * Math.PI) / 180), 0.2);

  /**
   * Fit the whole polygon in both axes. Longitude degrees are narrower than
   * latitude ones and the viewport is rarely square, so the latitude span has
   * to account for the aspect ratio or wide fields spill out of the frame.
   */
  const fittedSpan = useMemo(() => {
    const bounds = boundsOf(boundary);
    if (!bounds) return 0.045;
    const pad = 1.35;
    const latSpan = Math.max(bounds.maxLat - bounds.minLat, 0.001) * pad;
    const lonSpan = Math.max(bounds.maxLon - bounds.minLon, 0.001) * pad;
    return Math.max(latSpan, (lonSpan * cosLat) / aspect);
  }, [boundary, aspect, cosLat]);

  const baseSpan = editable ? 0.045 : fittedSpan;
  const spanLat = baseSpan / zoom;
  const spanLon = (spanLat * aspect) / cosLat;

  const project = (point: LatLng) => ({
    x: ((point[0] - (focus[0] - spanLon / 2)) / spanLon) * width,
    y: ((focus[1] + spanLat / 2 - point[1]) / spanLat) * height,
  });

  const unproject = (x: number, y: number): LatLng => [
    focus[0] - spanLon / 2 + (x / width) * spanLon,
    focus[1] + spanLat / 2 - (y / height) * spanLat,
  ];

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
    // Cache the on-screen origin so we can fall back to page coordinates when
    // the platform does not supply view-relative ones (react-native-web).
    surfaceRef.current?.measureInWindow((x, y) => {
      origin.current = { x, y };
    });
  };

  const handlePress = (event: GestureResponderEvent) => {
    if (!editable || !onAddPoint || width === 0) return;
    const { locationX, locationY, pageX, pageY } = event.nativeEvent;

    let x = locationX;
    let y = locationY;
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      if (!origin.current || !Number.isFinite(pageX) || !Number.isFinite(pageY)) return;
      x = pageX - origin.current.x;
      y = pageY - origin.current.y;
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    const [lon, lat] = unproject(x, y);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return;
    onAddPoint([Number(lon.toFixed(5)), Number(lat.toFixed(5))]);
  };

  const projected =
    width > 0
      ? boundary.map(project).filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
      : [];
  const path =
    projected.length >= 2
      ? `${projected
          .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)},${point.y.toFixed(1)}`)
          .join(' ')}${projected.length >= 3 ? ' Z' : ''}`
      : '';

  return (
    <View ref={surfaceRef} style={[styles.container, { height }, style]} onLayout={handleLayout}>
      <Pressable
        accessibilityRole={editable ? 'button' : 'image'}
        accessibilityLabel={editable ? 'Tap to place a boundary corner' : 'Field boundary'}
        onPress={handlePress}
        style={StyleSheet.absoluteFill}
      >
        {width > 0 ? (
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="imagery" x1="0" y1="0" x2="1" y2="1">
                <Stop offset="0" stopColor="#24361f" />
                <Stop offset="0.55" stopColor="#1b2a1c" />
                <Stop offset="1" stopColor="#2a3524" />
              </LinearGradient>
            </Defs>
            <Rect x={0} y={0} width={width} height={height} fill="url(#imagery)" />
            {/* Graticule — a light 8×5 grid so panning/zooming reads as spatial. */}
            {Array.from({ length: 9 }).map((_, index) => (
              <Path
                key={`v${index}`}
                d={`M${(width / 8) * index},0 L${(width / 8) * index},${height}`}
                stroke={onImagery(0.07)}
                strokeWidth={1}
              />
            ))}
            {Array.from({ length: 6 }).map((_, index) => (
              <Path
                key={`h${index}`}
                d={`M0,${(height / 5) * index} L${width},${(height / 5) * index}`}
                stroke={onImagery(0.07)}
                strokeWidth={1}
              />
            ))}
            {path ? (
              <Path
                d={path}
                fill={projected.length >= 3 ? withAlpha(fillColor, 0.5) : 'none'}
                stroke={strokeColor}
                strokeWidth={2.5}
                strokeLinejoin="round"
              />
            ) : null}
            {showVertices
              ? projected.map((point, index) => (
                  <Circle
                    key={`vertex-${index}`}
                    cx={point.x}
                    cy={point.y}
                    r={5}
                    fill={colors.white}
                    stroke={strokeColor}
                    strokeWidth={2}
                  />
                ))
              : null}
          </Svg>
        ) : null}
      </Pressable>

      {/* Chrome is for full-size maps only — thumbnails stay clean. */}
      {interactive ? (
        <>
          <View style={styles.zoomStack} pointerEvents="box-none">
            <Pressable
              accessibilityLabel="Zoom in"
              onPress={() => setZoom((z) => Math.min(z * 1.6, 24))}
              style={styles.zoomButton}
            >
              <Text style={styles.zoomGlyph}>+</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Zoom out"
              onPress={() => setZoom((z) => Math.max(z / 1.6, 0.25))}
              style={styles.zoomButton}
            >
              <Text style={styles.zoomGlyph}>-</Text>
            </Pressable>
          </View>

          <View style={styles.fallbackNote} pointerEvents="none">
            <Text style={styles.fallbackNoteText}>Coordinate view</Text>
          </View>
        </>
      ) : null}

      {children}
    </View>
  );
}

/* ------------------------------------------------------------------ *
 * Shared
 * ------------------------------------------------------------------ */

/** `#rrggbb` + alpha → `rgba(...)`, which both the SVG and native map accept. */
function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Floating label used over maps for point counts and hints. */
export function MapOverlayPill({ children, tone = 'light' }: { children: React.ReactNode; tone?: 'light' | 'dark' }) {
  return (
    <View style={[styles.pill, tone === 'dark' && styles.pillDark]}>
      <Text style={[styles.pillText, tone === 'dark' && styles.pillTextDark]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.imagery,
    borderWidth: 1,
    borderColor: ink(0.08),
  },
  vertex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vertexLabel: { ...type.badge, fontSize: 10, color: colors.accentDark },
  zoomStack: { position: 'absolute', right: space.md, bottom: space.md, gap: space.sm },
  zoomButton: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: onImagery(0.92),
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomGlyph: { ...type.heading, fontSize: 20, lineHeight: 22, color: colors.text },
  fallbackNote: {
    // Top-right, clear of the counter pill and the tool row.
    position: 'absolute',
    right: space.md,
    top: space.md,
    paddingHorizontal: space.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  fallbackNoteText: { ...type.badge, fontSize: 10, color: onImagery(0.75) },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: onImagery(0.94),
  },
  pillDark: { backgroundColor: 'rgba(28,42,29,0.78)' },
  pillText: { ...type.badge, color: colors.text },
  pillTextDark: { color: colors.white },
});
