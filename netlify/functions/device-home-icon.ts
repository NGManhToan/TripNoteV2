type NetlifyEvent = { httpMethod?: string; queryStringParameters?: Record<string, string | undefined> };
type FirestoreDocument = {
  fields?: {
    deviceHomeIcons?: { mapValue?: { fields?: Record<string, { stringValue?: string }> } };
  };
};

const headers = {
  "Content-Type": "image/png",
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  "X-Content-Type-Options": "nosniff",
  "Access-Control-Allow-Origin": "*",
};

export async function handler(event: NetlifyEvent) {
  if (event.httpMethod !== "GET") return { statusCode: 405, headers: { ...headers, Allow: "GET" }, body: "" };

  const deviceId = event.queryStringParameters?.deviceId ?? "";
  if (!/^[a-f0-9-]{36}$/i.test(deviceId)) return { statusCode: 400, headers, body: "" };

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || "trip-note-2ab10";
  const apiKey = process.env.VITE_FIREBASE_API_KEY || "AIzaSyCQ92hodZVXM29V38tSmI_CuynricGZzhg";
  const documentPath = "sharedWorkspaces/tripnote-public/preferences/favorites";
  const url = new URL(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${documentPath}`);
  url.searchParams.set("key", apiKey);

  try {
    const response = await fetch(url);
    if (!response.ok) return { statusCode: response.status === 404 ? 404 : 502, headers, body: "" };
    const document = await response.json() as FirestoreDocument;
    const dataUrl = document.fields?.deviceHomeIcons?.mapValue?.fields?.[deviceId]?.stringValue ?? "";
    const match = dataUrl.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
    if (!match || match[1]!.length > 350_000) return { statusCode: 404, headers, body: "" };
    return { statusCode: 200, headers, isBase64Encoded: true, body: match[1]! };
  } catch (error) {
    console.error("Could not load the device-specific home screen icon", error);
    return { statusCode: 502, headers, body: "" };
  }
}
