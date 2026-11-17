import { useCallback, useState } from "react";

// Home Screen icons belong to one iPhone, so keep this photo on that device.
// The shared in-app icon is stored separately by useSharedAppIcon.
const LOCAL_ICON_KEY = "tripnote-v2-home-icon-local";

function readLocalIcon() {
  try { return localStorage.getItem(LOCAL_ICON_KEY) ?? ""; }
  catch { return ""; }
}

export function useDeviceHomeIcon() {
  const [homeIcon, setHomeIcon] = useState(readLocalIcon);

  const saveDeviceHomeIcon = useCallback(async (iconData: string) => {
    try {
      if (iconData) localStorage.setItem(LOCAL_ICON_KEY, iconData);
      else localStorage.removeItem(LOCAL_ICON_KEY);
      setHomeIcon(iconData);
      return true;
    } catch {
      setHomeIcon(iconData);
      return false;
    }
  }, []);

  return { homeIcon, saveDeviceHomeIcon };
}
