import { multiStopPreviewTrip, sampleTrips, type Trip } from "./data";
import { inferImportedDestination } from "../excel/workbook";

const STORAGE_KEY = "tripnote-v2-trips";
const MULTI_STOP_PREVIEW_KEY = "tripnote-v2-multi-stop-preview-added";
const LEGACY_MIGRATION_KEY = "tripnote-v2-legacy-account-migrated";

function userStorageKey(userId: string) {
  return `${STORAGE_KEY}:${userId}`;
}

export function loadTripsForUser(userId: string): Trip[] | null {
  try {
    const stored = window.localStorage.getItem(userStorageKey(userId));
    if (!stored) return null;
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed as Trip[] : null;
  } catch {
    return null;
  }
}

export function saveTripsForUser(userId: string, trips: Trip[]) {
  try {
    window.localStorage.setItem(userStorageKey(userId), JSON.stringify(trips));
  } catch {
    // Firestore remains the source of truth when local storage is unavailable.
  }
}

export function claimLegacyTripsForMigration(): Trip[] {
  try {
    const existingOwner = window.localStorage.getItem(LEGACY_MIGRATION_KEY);
    if (existingOwner) return [];
    const legacyTrips = loadTrips().filter((trip) => !trip.isDemo);
    return legacyTrips;
  } catch {
    return [];
  }
}

export function completeLegacyTripsMigration(userId: string) {
  try {
    window.localStorage.setItem(LEGACY_MIGRATION_KEY, userId);
  } catch {
    // Migration may be retried from Firestore on the next session.
  }
}

function addDevelopmentPreview(trips: Trip[]): Trip[] {
  if (!import.meta.env.DEV) return trips;
  const existingPreview = trips.find((trip) => trip.id === multiStopPreviewTrip.id);
  if (existingPreview) {
    const orderedTrips = [existingPreview, ...trips.filter((trip) => trip.id !== multiStopPreviewTrip.id)];
    if (orderedTrips[0] !== trips[0]) saveTrips(orderedTrips);
    return orderedTrips;
  }
  if (window.localStorage.getItem(MULTI_STOP_PREVIEW_KEY)) return trips;
  const withPreview = [multiStopPreviewTrip, ...trips];
  window.localStorage.setItem(MULTI_STOP_PREVIEW_KEY, "true");
  saveTrips(withPreview);
  return withPreview;
}

export function loadTrips(): Trip[] {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const initialTrips = addDevelopmentPreview(sampleTrips);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(initialTrips));
      return initialTrips;
    }
    const parsed: unknown = JSON.parse(stored);
    if (!Array.isArray(parsed)) return sampleTrips;
    const trips = (parsed as Trip[]).filter((trip) => trip && typeof trip.id === "string" && (!trip.isDemo || !["sample-temple", "sample-city", "sample-mountains"].includes(trip.id)));
    const migratedTrips = trips.map((trip) => {
      if (!trip.importSource || trip.destination !== "Chưa xác định") return trip;
      const activities = (trip.itinerary ?? []).flatMap((day) => day.activities.map((activity) => ({ activity })));
      const destination = inferImportedDestination(trip.importSource, activities, trip.places ?? []);
      return destination === "Chưa xác định" ? trip : { ...trip, destination };
    });
    if (migratedTrips.some((trip, index) => trip !== trips[index])) saveTrips(migratedTrips);
    return addDevelopmentPreview(migratedTrips);
  } catch {
    return sampleTrips;
  }
}

export function saveTrips(trips: Trip[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch {
    // Keep the in-memory session usable if browser storage is unavailable/full.
  }
}

