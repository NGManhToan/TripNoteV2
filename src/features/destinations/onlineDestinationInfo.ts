export type OnlineDestinationInfo = {
  summary: string;
  sourceUrl: string;
};

const cacheKey = "tripnote-wikipedia-destination-info-v2";
const summaryEndpoint = "https://vi.wikipedia.org/api/rest_v1/page/summary/";
const searchEndpoint = "https://vi.wikipedia.org/w/api.php";

function compactSummary(value: string): string {
  const text = value.replace(/\s+/g, " ").trim();
  const firstSentenceEnd = text.search(/[.!?](?:\s|$)/);
  if (firstSentenceEnd >= 55 && firstSentenceEnd <= 170) return text.slice(0, firstSentenceEnd + 1);
  if (text.length <= 155) return text;
  const cut = text.slice(0, 152).lastIndexOf(" ");
  return `${text.slice(0, cut > 90 ? cut : 152).trimEnd()}…`;
}

function readCache(): Record<string, OnlineDestinationInfo | null> {
  try {
    return JSON.parse(localStorage.getItem(cacheKey) ?? "{}") as Record<string, OnlineDestinationInfo | null>;
  } catch {
    return {};
  }
}

function writeCache(cache: Record<string, OnlineDestinationInfo | null>) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(cache));
  } catch {
    // The network result remains usable when browser storage is unavailable.
  }
}

function titleVariants(name: string) {
  const base = name.trim().replace(/\s+/g, "_");
  const withoutDiacritics = base.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d");
  return [...new Set([base, withoutDiacritics])];
}

export async function fetchOnlineDestinationInfo(id: string, name: string): Promise<OnlineDestinationInfo | null> {
  const cache = readCache();
  if (Object.hasOwn(cache, id)) {
    const cached = cache[id];
    return cached ? { ...cached, summary: compactSummary(cached.summary) } : null;
  }

  const fetchSummary = async (title: string) => {
    try {
      const response = await fetch(`${summaryEndpoint}${encodeURIComponent(title)}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return null;
      const data = await response.json() as { extract?: string; content_urls?: { desktop?: { page?: string } }; type?: string };
      const rawSummary = data.extract?.trim();
      const sourceUrl = data.content_urls?.desktop?.page;
      if (rawSummary && sourceUrl && data.type !== "disambiguation") {
        return { summary: compactSummary(rawSummary), sourceUrl };
      }
      return null;
    } catch {
      return null;
    }
  };

  for (const title of titleVariants(name)) {
    const result = await fetchSummary(title);
    if (result) {
      writeCache({ ...readCache(), [id]: result });
      return result;
    }
  }

  // Most official directory entries are not article titles. Search Wikipedia's
  // own index so matching articles can still provide sourced descriptions.
  try {
    const params = new URLSearchParams({ action: "query", list: "search", srsearch: `${name} Việt Nam`, srlimit: "5", format: "json", origin: "*" });
    const response = await fetch(`${searchEndpoint}?${params.toString()}`, { headers: { Accept: "application/json" } });
    if (response.ok) {
      const data = await response.json() as { query?: { search?: Array<{ title?: string }> } };
      for (const result of data.query?.search ?? []) {
        if (!result.title) continue;
        const summary = await fetchSummary(result.title.replace(/ /g, "_"));
        if (summary) {
          writeCache({ ...readCache(), [id]: summary });
          return summary;
        }
      }
    }
  } catch {
    // Preserve the official directory link as a fallback in the detail view.
  }

  writeCache({ ...readCache(), [id]: null });
  return null;
}
