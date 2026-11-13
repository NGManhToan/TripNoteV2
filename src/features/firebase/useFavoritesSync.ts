import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore } from "./client";

const SHARED_WORKSPACE_ID = "tripnote-public";
const FAVORITES_STORAGE_KEY = "tripnote-v2-favorite-destinations";
const FAVORITES_DOCUMENT_ID = "favorites";

function uniqueFavorites(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((item): item is string => typeof item === "string" && item.length > 0))];
}

function sameFavorites(left: string[], right: string[]) {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function readLocalFavorites() {
  try {
    return uniqueFavorites(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

/** Shares saved destination IDs across devices that open the same public TripNote link. */
export function useFavoritesSync(favorites: string[], setFavorites: Dispatch<SetStateAction<string[]>>) {
  const readyRef = useRef(false);
  const remoteFavoritesRef = useRef<string[]>([]);

  useEffect(() => {
    if (!firestore) {
      readyRef.current = false;
      return;
    }

    const db = firestore;
    const favoriteDoc = doc(db, "sharedWorkspaces", SHARED_WORKSPACE_ID, "preferences", FAVORITES_DOCUMENT_ID);
    let firstServerSnapshot = true;
    readyRef.current = false;

    const unsubscribe = onSnapshot(favoriteDoc, async (snapshot) => {
      if (snapshot.metadata.fromCache && firstServerSnapshot) return;

      const remoteIds = uniqueFavorites(snapshot.data()?.destinationIds);
      if (firstServerSnapshot) {
        firstServerSnapshot = false;
        // Merge this browser's existing saved places into the shared list once, so
        // connecting Firebase does not discard favorites already stored locally.
        const mergedIds = [...new Set([...remoteIds, ...readLocalFavorites()])];
        remoteFavoritesRef.current = mergedIds;
        readyRef.current = true;
        setFavorites((current) => sameFavorites(current, mergedIds) ? current : mergedIds);

        if (!sameFavorites(remoteIds, mergedIds)) {
          try {
            await setDoc(favoriteDoc, { destinationIds: mergedIds, updatedAt: serverTimestamp() });
          } catch {
            readyRef.current = false;
          }
        }
        return;
      }

      remoteFavoritesRef.current = remoteIds;
      setFavorites((current) => sameFavorites(current, remoteIds) ? current : remoteIds);
    }, () => {
      // Keep using local favorites while Firebase is unavailable.
      readyRef.current = false;
    });

    return () => {
      readyRef.current = false;
      unsubscribe();
    };
  }, [setFavorites]);

  useEffect(() => {
    if (!firestore || !readyRef.current || sameFavorites(favorites, remoteFavoritesRef.current)) return;

    const db = firestore;
    const nextFavorites = uniqueFavorites(favorites);
    remoteFavoritesRef.current = nextFavorites;
    void setDoc(doc(db, "sharedWorkspaces", SHARED_WORKSPACE_ID, "preferences", FAVORITES_DOCUMENT_ID), {
      destinationIds: nextFavorites,
      updatedAt: serverTimestamp(),
    }).catch(() => {
      readyRef.current = false;
    });
  }, [favorites]);
}
