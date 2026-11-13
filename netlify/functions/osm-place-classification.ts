import { officialDestinationRecords } from "../../src/features/destinations/officialRecords";

type NetlifyEvent = { httpMethod?: string; queryStringParameters?: Record<string, string | undefined> };
type OSMPlace = {
  place_id?: number;
  osm_type?: string;
  osm_id?: number;
  name?: string;
  extratags?: Record<string, string>;
};
type RegistryEntry = { id: string; name: string; province: string };

const curatedDestinations: RegistryEntry[] = [
  { id: "ha-long", name: "Vịnh Hạ Long", province: "Quảng Ninh" },
  { id: "phu-quoc", name: "Phú Quốc", province: "An Giang" },
  { id: "sa-pa", name: "Sa Pa", province: "Lào Cai" },
  { id: "hoi-an", name: "Hội An", province: "Đà Nẵng" },
  { id: "da-lat", name: "Đà Lạt", province: "Lâm Đồng" },
  { id: "ha-noi", name: "Hà Nội", province: "Hà Nội" },
  { id: "hue", name: "Huế", province: "Huế" },
  { id: "da-nang", name: "Đà Nẵng", province: "Đà Nẵng" },
  { id: "ninh-binh", name: "Ninh Bình", province: "Ninh Bình" },
  { id: "ha-giang", name: "Hà Giang", province: "Tuyên Quang" },
  { id: "ho-chi-minh-city", name: "Thành phố Hồ Chí Minh", province: "Thành phố Hồ Chí Minh" },
  { id: "tan-lap-floating-village", name: "Làng nổi Tân Lập", province: "Tây Ninh" },
  { id: "lang-sen-wetland", name: "Khu bảo tồn đất ngập nước Láng Sen", province: "Tây Ninh" },
  { id: "ba-den-mountain", name: "Núi Bà Đen", province: "Tây Ninh" },
  { id: "cao-dai-holy-see", name: "Tòa Thánh Cao Đài Tây Ninh", province: "Tây Ninh" },
  { id: "dau-tieng-lake", name: "Hồ Dầu Tiếng", province: "Tây Ninh" },
];

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLocaleLowerCase("vi-VN").replace(/[^a-z0-9]+/g, " ").trim();
const slug = (value: string) => normalize(value).replace(/\s+/g, "-");
const destinationById = new Map([
  ...curatedDestinations,
  ...officialDestinationRecords.map((record) => ({ id: `vnt-${slug(record.name)}`, name: record.name, province: record.province })),
].map((entry) => [entry.id, entry]));

const aliases: Record<string, string[]> = {
  "ha-long": ["ha long bay", "halong bay"],
  "phu-quoc": ["phu quoc island"],
  "sa-pa": ["sapa", "sa pa town"],
  "hoi-an": ["hoi an ancient town"],
  "da-lat": ["da lat city", "dalat"],
  "ha-noi": ["hanoi", "ha noi city"],
  "da-nang": ["danang", "da nang city"],
  "ho-chi-minh-city": ["ho chi minh city", "saigon", "sai gon"],
};

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
  "X-Content-Type-Options": "nosniff",
};

function hasConfidentNameMatch(placeName: string, destination: RegistryEntry) {
  const actualName = normalize(placeName);
  return actualName === normalize(destination.name) || (aliases[destination.id] ?? []).some((alias) => actualName === normalize(alias));
}

export async function handler(event: NetlifyEvent) {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, headers: { ...headers, Allow: "GET" }, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const destinationId = event.queryStringParameters?.destinationId;
  const destination = destinationId ? destinationById.get(destinationId) : undefined;
  if (!destination) return { statusCode: 400, headers, body: JSON.stringify({ error: "Unknown destination" }) };

  try {
    const params = new URLSearchParams({
      q: `${destination.name}, ${destination.province}, Vietnam`,
      format: "jsonv2",
      addressdetails: "0",
      extratags: "1",
      namedetails: "1",
      limit: "8",
      countrycodes: "vn",
    });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: { "User-Agent": "TripNoteV2/1.0 (OpenStreetMap destination classification lookup)" },
    });
    if (!response.ok) throw new Error(`Nominatim request failed (${response.status})`);
    const places = await response.json() as OSMPlace[];
    const match = places.find((place) => place.name && hasConfidentNameMatch(place.name, destination) && place.osm_type && place.osm_id);
    const place = match ? {
      placeId: `${match.osm_type}/${match.osm_id}`,
      name: match.name,
      stars: match.extratags?.stars,
      fee: match.extratags?.fee,
      charge: match.extratags?.charge,
      website: match.extratags?.website,
      openStreetMapUrl: `https://www.openstreetmap.org/${match.osm_type}/${match.osm_id}`,
    } : null;
    return { statusCode: 200, headers, body: JSON.stringify({ place }) };
  } catch (error) {
    console.error("OpenStreetMap classification lookup failed", error);
    return { statusCode: 502, headers: { ...headers, "Cache-Control": "no-store" }, body: JSON.stringify({ error: "Could not load OpenStreetMap classification" }) };
  }
}
