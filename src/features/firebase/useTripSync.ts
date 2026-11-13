import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import type { Trip } from "../trips/data";
import { loadTrips, saveTrips } from "../trips/storage";
import { firestore } from "./client";

export type TripSyncState = "local" | "connecting" | "synced" | "offline";

const SHARED_WORKSPACE_ID = "tripnote-public";

function sameTrip(a: Trip | undefined, b: Trip | undefined) {
  return JSON.stringify(stripUndefined(a)) === JSON.stringify(stripUndefined(b));
}

/** Firestore rejects undefined values, which can appear in optional trip/activity fields. */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => item === undefined ? null : stripUndefined(item)) as T;
  }
  if (value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key, stripUndefined(item)]),
    ) as T;
  }
  return value;
}

/** Syncs trips to one public Firestore workspace so the same app link shares data across devices. */
export function useTripSync(trips: Trip[], setTrips: Dispatch<SetStateAction<Trip[]>>) {
  const [status, setStatus] = useState<TripSyncState>(firestore ? "connecting" : "local");
  const readyRef = useRef(false);
  const suppressWriteRef = useRef(false);
  const cloudTripsRef = useRef<Map<string, Trip>>(new Map());
  const cloudOrderRef = useRef<Map<string, number>>(new Map());

  const setOffline = useCallback(() => setStatus("offline"), []);

  useEffect(() => {
    if (!firestore) {
      readyRef.current = false;
      return;
    }

    const db = firestore;
    const tripsCollection = collection(db, "sharedWorkspaces", SHARED_WORKSPACE_ID, "trips");
    let firstServerSnapshot = true;
    readyRef.current = false;

    const unsubscribe = onSnapshot(tripsCollection, async (snapshot) => {
      if (snapshot.metadata.fromCache && firstServerSnapshot) {
        setStatus("offline");
        return;
      }

      const remoteTrips = snapshot.docs
        .flatMap((entry) => {
          const trip = entry.data().trip as Trip | undefined;
          return trip && typeof trip.id === "string"
            ? [{ trip, order: typeof entry.data().order === "number" ? entry.data().order as number : Number.MAX_SAFE_INTEGER }]
            : [];
        })
        .sort((a, b) => a.order - b.order)
        .map(({ trip }) => trip);

      cloudTripsRef.current = new Map(remoteTrips.map((trip) => [trip.id, trip]));
      cloudOrderRef.current = new Map(snapshot.docs.map((entry) => [entry.id, typeof entry.data().order === "number" ? entry.data().order as number : Number.MAX_SAFE_INTEGER]));

      if (firstServerSnapshot) {
        firstServerSnapshot = false;
        // Seed an empty shared workspace once from this browser's existing non-demo trips.
        // Demo/sample cards are intentionally never published as personal data.
        const localTrips = loadTrips().filter((trip) => !trip.isDemo);
        if (remoteTrips.length === 0 && localTrips.length > 0) {
          try {
            for (const [order, trip] of localTrips.entries()) {
              await setDoc(doc(db, "sharedWorkspaces", SHARED_WORKSPACE_ID, "trips", trip.id), {
                trip: stripUndefined(trip),
                order,
                updatedAt: serverTimestamp(),
              });
              cloudTripsRef.current.set(trip.id, trip);
              cloudOrderRef.current.set(trip.id, order);
            }
            suppressWriteRef.current = true;
            setTrips(localTrips);
            saveTrips(localTrips);
            readyRef.current = true;
            setStatus("synced");
            return;
          } catch {
            setStatus("offline");
            return;
          }
        }
      }

      suppressWriteRef.current = true;
      setTrips(remoteTrips);
      saveTrips(remoteTrips);
      readyRef.current = true;
      setStatus(snapshot.metadata.fromCache ? "offline" : "synced");
    }, () => {
      if (!readyRef.current) readyRef.current = true;
      setStatus("offline");
    });

    return () => {
      unsubscribe();
      readyRef.current = false;
    };
  }, [setTrips]);

  useEffect(() => {
    if (!firestore || !readyRef.current) return;
    saveTrips(trips);
    if (suppressWriteRef.current) {
      suppressWriteRef.current = false;
      return;
    }

    const db = firestore;
    const remote = cloudTripsRef.current;
    const localMap = new Map(trips.map((trip) => [trip.id, trip]));
    for (const [order, [id, trip]] of [...localMap.entries()].entries()) {
      if (sameTrip(remote.get(id), trip) && cloudOrderRef.current.get(id) === order) continue;
      void (async () => {
        try {
          await setDoc(doc(db, "sharedWorkspaces", SHARED_WORKSPACE_ID, "trips", id), {
            trip: stripUndefined(trip),
            order,
            updatedAt: serverTimestamp(),
          });
          remote.set(id, trip);
          cloudOrderRef.current.set(id, order);
          setStatus("synced");
        } catch {
          setOffline();
        }
      })();
    }
    for (const id of remote.keys()) {
      if (localMap.has(id)) continue;
      void deleteDoc(doc(db, "sharedWorkspaces", SHARED_WORKSPACE_ID, "trips", id)).then(() => {
        remote.delete(id);
        cloudOrderRef.current.delete(id);
      }).catch(setOffline);
    }
  }, [trips, setOffline]);

  return !firestore ? "local" : status;
}
