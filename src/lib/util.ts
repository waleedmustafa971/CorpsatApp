import { HealthClass, RiskLevel } from '../types';
import { palette } from './theme';

/* ------------------------------------------------------------------ *
 * Derivations — these must stay identical to the admin web panel.
 * ------------------------------------------------------------------ */

export function riskLevelOf(rating: number): RiskLevel {
  if (rating < 0.34) return 'Low';
  if (rating < 0.67) return 'Moderate';
  return 'High';
}

export function healthClassOf(ndvi: number): HealthClass {
  if (ndvi <= 0.33) return 'Danger';
  if (ndvi <= 0.66) return 'Distress';
  return 'Health';
}

/** Health score shown to the farmer = round(latestNdvi * 100). */
export function healthScoreOf(ndvi: number): number {
  return Math.round(ndvi * 100);
}

export function ndviColor(v: number): string {
  if (v <= 0.15) return '#b5541c';
  if (v <= 0.33) return '#d98f3d';
  if (v <= 0.5) return '#d9c94a';
  if (v <= 0.66) return '#8fbf49';
  if (v <= 0.8) return '#4c9a3f';
  return '#2f7d32';
}

export function riskColor(level: RiskLevel): string {
  if (level === 'Low') return palette.riskLow;
  if (level === 'Moderate') return palette.riskModerate;
  return palette.riskHigh;
}

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatShortDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

/** "3 days ago" / "today" — used on submission banners. */
export function relativeDate(iso: string | undefined): string {
  if (!iso) return '';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days} days ago`;
  const months = Math.round(days / 30);
  return months === 1 ? 'a month ago' : `${months} months ago`;
}

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('en-GB', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Normalises a phone number for comparison: digits and a leading +. */
export function normalisePhone(phone: string): string {
  const trimmed = phone.trim();
  const digits = trimmed.replace(/[^\d]/g, '');
  return trimmed.startsWith('+') ? `+${digits}` : digits;
}

export function samePhone(a: string, b: string): boolean {
  return normalisePhone(a) === normalisePhone(b);
}

/** Formats "+249900000000" as "+249 900 000 000" while typing. */
export function formatPhoneInput(raw: string): string {
  const hasPlus = raw.trim().startsWith('+');
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return hasPlus ? '+' : '';
  const country = digits.slice(0, 3);
  const rest = digits.slice(3);
  const groups = rest.match(/.{1,3}/g) ?? [];
  return `+${[country, ...groups].join(' ')}`.trimEnd();
}

export function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function uid(prefix: string): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${random}`;
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
