import { useCallback, useEffect, useState } from "react";
import { deleteField, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore } from "./client";

const SHARED_WORKSPACE_ID = "tripnote-public";
const ICON_DOCUMENT_ID = "favorites";
const TOKEN_KEY = "tripnote-v2-home-icon-token";
const LOCAL_ICON_KEY = "tripnote-v2-home-icon-local";
const PROFILE_QUERY_KEY = "tripnoteHomeIcon";

function createToken() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
}

function getToken() {
  try {
    const fromProfile = new URLSearchParams(window.location.search).get(PROFILE_QUERY_KEY);
    if (fromProfile && /^[a-f0-9-]{32,36}$/i.test(fromProfile)) {
      localStorage.setItem(TOKEN_KEY, fromProfile);
      return fromProfile;
    }
    const existing = localStorage.getItem(TOKEN_KEY);
    if (existing) return existing;
    const token = createToken();
    localStorage.setItem(TOKEN_KEY, token);
    return token;
  } catch { return createToken(); }
}

function readLocalIcon(token: string) {
  try { return localStorage.getItem(`${LOCAL_ICON_KEY}:${token}`) ?? ""; }
  catch { return ""; }
}

function writeLocalIcon(token: string, icon: string) {
  try {
    const key = `${LOCAL_ICON_KEY}:${token}`;
    if (icon) localStorage.setItem(key, icon);
    else localStorage.removeItem(key);
  } catch { /* Firestore remains authoritative if local storage is unavailable. */ }
}

export function useDeviceHomeIcon() {
  const [token] = useState(getToken);
  const [homeIcon, setHomeIcon] = useState(() => readLocalIcon(token));

  useEffect(() => {
    if (!firestore) return;
    const iconDoc = doc(firestore, "sharedWorkspaces", SHARED_WORKSPACE_ID, "preferences", ICON_DOCUMENT_ID);
    return onSnapshot(iconDoc, (snapshot) => {
      if (snapshot.metadata.fromCache) return;
      const icons = snapshot.data()?.homeScreenIcons as Record<string, unknown> | undefined;
      const remoteIcon = typeof icons?.[token] === "string" ? icons[token] as string : "";
      if (remoteIcon) {
        setHomeIcon(remoteIcon);
        writeLocalIcon(token, remoteIcon);
        return;
      }

      const localIcon = readLocalIcon(token);
      setHomeIcon(localIcon);
      if (localIcon) {
        void setDoc(iconDoc, {
          homeScreenIcons: { [token]: localIcon },
          homeScreenIconsUpdatedAt: serverTimestamp(),
        }, { merge: true }).catch((error) => console.error("Could not migrate the local iPhone icon to Firestore", error));
      }
    }, (error) => console.error("Could not load the iPhone Home Screen icon", error));
  }, [token]);

  const saveDeviceHomeIcon = useCallback(async (iconData: string) => {
    setHomeIcon(iconData);
    writeLocalIcon(token, iconData);
    if (!firestore) return false;
    try {
      await setDoc(doc(firestore, "sharedWorkspaces", SHARED_WORKSPACE_ID, "preferences", ICON_DOCUMENT_ID), {
        homeScreenIcons: { [token]: iconData },
        homeScreenIconsUpdatedAt: serverTimestamp(),
        // Remove oversized per-device maps written by earlier versions.
        deviceHomeIcons: deleteField(),
        deviceHomeIconVersions: deleteField(),
        deviceHomeIconUpdatedAt: deleteField(),
      }, { merge: true });
      return true;
    } catch (error) {
      console.error("Could not sync the iPhone Home Screen icon", error);
      return false;
    }
  }, [token]);

  return { token, homeIcon, saveDeviceHomeIcon };
}
