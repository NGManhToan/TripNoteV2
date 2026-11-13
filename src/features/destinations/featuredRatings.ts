export type FeaturedPlaceRating = {
  placeId: string;
  name: string;
  stars?: string;
  fee?: string;
  charge?: string;
  website?: string;
  openStreetMapUrl: string;
};

const cacheKey = "tripnote-osm-place-details-v2";
const requestGap = 1_100;
let lastRequestAt = 0;
let requestQueue: Promise<void> = Promise.resolve();

function readCache(): Record<string, FeaturedPlaceRating | null> {
  try {
    return JSON.parse(localStorage.getItem(cacheKey) ?? "{}") as Record<string, FeaturedPlaceRating | null>;
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, FeaturedPlaceRating | null>) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(cache));
  } catch {
    // Cached classifications are an optional performance improvement.
  }
}

export async function fetchOpenStreetMapClassification(destinationId: string): Promise<FeaturedPlaceRating | null> {
  const cache = readCache();
  if (Object.hasOwn(cache, destinationId)) return cache[destinationId] ?? null;

  const request = requestQueue.then(async () => {
    const wait = Math.max(0, requestGap - (Date.now() - lastRequestAt));
    if (wait) await new Promise((resolve) => window.setTimeout(resolve, wait));
    lastRequestAt = Date.now();
    const params = new URLSearchParams({ destinationId });
    const response = await fetch(`/.netlify/functions/osm-place-classification?${params.toString()}`);
    if (!response.ok) throw new Error(`OpenStreetMap lookup failed (${response.status})`);
    const data = await response.json() as { place?: FeaturedPlaceRating | null };
    const place = data.place;
    const result = place && typeof place.placeId === "string" && typeof place.name === "string"
      ? place
      : null;
    writeCache({ ...readCache(), [destinationId]: result });
    return result;
  });
  requestQueue = request.then(() => undefined, () => undefined);
  return request;
}
