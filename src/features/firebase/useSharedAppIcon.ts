import { useCallback, useEffect, useRef, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore } from "./client";

const SHARED_WORKSPACE_ID = "tripnote-public";
// Reuse the already-authorized shared preferences document so icon sync works
// with the Firebase Rules currently published for favorites.
const APP_ICON_DOCUMENT_ID = "favorites";
const APP_ICON_STORAGE_KEY = "tripnote-v2-custom-app-icon";

type SharedIconStatus = "local" | "connecting" | "synced" | "offline";

function getLocalIcon() {
  try { return localStorage.getItem(APP_ICON_STORAGE_KEY) ?? ""; }
  catch { return ""; }
}

export function useSharedAppIcon() {
  const [customAppIcon, setCustomAppIcon] = useState(getLocalIcon);
  const [status, setStatus] = useState<SharedIconStatus>(firestore ? "connecting" : "local");
  const readyRef = useRef(false);
  const remoteIconRef = useRef("");
  const pendingIconRef = useRef<string | null>(null);

  const writeIcon = useCallback(async (iconData: string) => {
    if (!firestore) return false;
    try {
      await setDoc(doc(firestore, "sharedWorkspaces", SHARED_WORKSPACE_ID, "preferences", APP_ICON_DOCUMENT_ID), {
        iconData,
        updatedAt: serverTimestamp(),
      }, { merge: true });
      remoteIconRef.current = iconData;
      pendingIconRef.current = null;
      setStatus("synced");
      return true;
    } catch {
      setStatus("offline");
      return false;
    }
  }, []);

  useEffect(() => {
    if (!firestore) {
      readyRef.current = false;
      return;
    }

    const iconDocument = doc(firestore, "sharedWorkspaces", SHARED_WORKSPACE_ID, "preferences", APP_ICON_DOCUMENT_ID);
    let firstSnapshot = true;
    readyRef.current = false;
    const unsubscribe = onSnapshot(iconDocument, { includeMetadataChanges: true }, (snapshot) => {
      if (snapshot.metadata.fromCache) {
        setStatus("offline");
        return;
      }
      const remoteIcon = typeof snapshot.data()?.iconData === "string" ? snapshot.data()?.iconData as string : "";

      if (firstSnapshot) {
        firstSnapshot = false;
        readyRef.current = true;
        const pendingIcon = pendingIconRef.current;
        if (pendingIcon !== null) {
          remoteIconRef.current = remoteIcon;
          void writeIcon(pendingIcon);
        } else if (remoteIcon) {
          remoteIconRef.current = remoteIcon;
          setCustomAppIcon(remoteIcon);
          setStatus("synced");
        } else {
          const localIcon = getLocalIcon();
          remoteIconRef.current = "";
          if (localIcon) void writeIcon(localIcon);
          else setStatus("synced");
        }
        return;
      }

      if (pendingIconRef.current !== null) {
        if (remoteIcon === pendingIconRef.current) {
          remoteIconRef.current = remoteIcon;
          pendingIconRef.current = null;
          setStatus("synced");
        } else {
          void writeIcon(pendingIconRef.current);
        }
        return;
      }
      if (remoteIcon === remoteIconRef.current) return;
      remoteIconRef.current = remoteIcon;
      pendingIconRef.current = null;
      setCustomAppIcon(remoteIcon);
      setStatus("synced");
    }, () => setStatus("offline"));

    return () => {
      readyRef.current = false;
      unsubscribe();
    };
  }, [writeIcon]);

  useEffect(() => {
    try {
      if (customAppIcon) localStorage.setItem(APP_ICON_STORAGE_KEY, customAppIcon);
      else localStorage.removeItem(APP_ICON_STORAGE_KEY);
    } catch { /* the shared Firestore copy remains available when local storage is full */ }
  }, [customAppIcon]);

  const saveCustomAppIcon = useCallback(async (iconData: string) => {
    pendingIconRef.current = iconData;
    setCustomAppIcon(iconData);
    if (!firestore) {
      setStatus("local");
      return false;
    }
    if (!readyRef.current) return false;
    return writeIcon(iconData);
  }, [writeIcon]);

  return { customAppIcon, saveCustomAppIcon, syncStatus: status };
}
