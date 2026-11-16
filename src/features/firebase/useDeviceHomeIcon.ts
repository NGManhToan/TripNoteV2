import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore } from "./client";

const SHARED_WORKSPACE_ID = "tripnote-public";
const ICON_DOCUMENT_ID = "favorites";
const DEVICE_ID_KEY = "tripnote-v2-home-icon-device-id";
const LOCAL_ICON_KEY = "tripnote-v2-home-icon-local";

function createDeviceId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  const hex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16));
  hex[12] = "4";
  hex[16] = ((Number.parseInt(hex[16]!, 16) & 3) | 8).toString(16);
  return `${hex.slice(0, 8).join("")}-${hex.slice(8, 12).join("")}-${hex.slice(12, 16).join("")}-${hex.slice(16, 20).join("")}-${hex.slice(20).join("")}`;
}

function getDeviceId() {
  try {
    const current = localStorage.getItem(DEVICE_ID_KEY);
    if (current) return current;
    const next = createDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, next);
    return next;
  } catch {
    return createDeviceId();
  }
}

function readLocalIcon() {
  try { return localStorage.getItem(LOCAL_ICON_KEY) ?? ""; }
  catch { return ""; }
}

type DeviceHomeIconState = "connecting" | "synced" | "offline";

export function useDeviceHomeIcon() {
  const [deviceId] = useState(getDeviceId);
  const [homeIcon, setHomeIcon] = useState(readLocalIcon);
  const [version, setVersion] = useState(0);
  const [status, setStatus] = useState<DeviceHomeIconState>(firestore ? "connecting" : "offline");

  useEffect(() => {
    if (!firestore) return;
    const iconDoc = doc(firestore, "sharedWorkspaces", SHARED_WORKSPACE_ID, "preferences", ICON_DOCUMENT_ID);
    return onSnapshot(iconDoc, (snapshot) => {
      if (snapshot.metadata.fromCache) return;
      const data = snapshot.data();
      const icons = data?.deviceHomeIcons as Record<string, unknown> | undefined;
      const versions = data?.deviceHomeIconVersions as Record<string, unknown> | undefined;
      const remoteIcon = typeof icons?.[deviceId] === "string" ? icons[deviceId] as string : "";
      const remoteVersion = typeof versions?.[deviceId] === "number" ? versions[deviceId] as number : 0;
      setHomeIcon(remoteIcon);
      setVersion(remoteVersion);
      setStatus("synced");
      try {
        if (remoteIcon) localStorage.setItem(LOCAL_ICON_KEY, remoteIcon);
        else localStorage.removeItem(LOCAL_ICON_KEY);
      } catch { /* Firestore remains the source of truth when local storage is unavailable. */ }
    }, () => setStatus("offline"));
  }, [deviceId]);

  const saveDeviceHomeIcon = useCallback(async (iconData: string) => {
    const nextVersion = Date.now();
    setHomeIcon(iconData);
    setVersion(nextVersion);
    try {
      if (iconData) localStorage.setItem(LOCAL_ICON_KEY, iconData);
      else localStorage.removeItem(LOCAL_ICON_KEY);
    } catch { /* Keep the current selection in memory for this visit. */ }
    if (!firestore) { setStatus("offline"); return false; }

    try {
      await setDoc(doc(firestore, "sharedWorkspaces", SHARED_WORKSPACE_ID, "preferences", ICON_DOCUMENT_ID), {
        deviceHomeIcons: { [deviceId]: iconData },
        deviceHomeIconVersions: { [deviceId]: nextVersion },
        deviceHomeIconUpdatedAt: serverTimestamp(),
      }, { merge: true });
      setStatus("synced");
      return true;
    } catch {
      setStatus("offline");
      return false;
    }
  }, [deviceId]);

  return { deviceId, homeIcon, version, status, saveDeviceHomeIcon };
}
