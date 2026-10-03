import { Router, Request, Response } from "express";

const router = Router();

// National average fuel prices in France, from the official open data
// (prix-carburants, data.economie.gouv.fr — free, no API key).
// Gasoline = SP95-E10, the most common unleaded fuel. Diesel = gazole.
// Outside France, viewers set their own prices in the dashboard (saved in their browser).
const FRANCE_API =
  "https://data.economie.gouv.fr/api/explore/v2.1/catalog/datasets/prix-des-carburants-en-france-flux-instantane-v2/records";

const CACHE_MS = 6 * 60 * 60 * 1000; // prices change daily: refresh every 6h

interface FuelPrices {
  gasoline: number | null; // EUR per liter
  diesel: number | null;
  updated_at: string | null;
}

let cache: { at: number; prices: FuelPrices } | null = null;

async function getFranceAverages(): Promise<FuelPrices> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.prices;
  try {
    const url = new URL(FRANCE_API);
    url.searchParams.set("select", "avg(e10_prix) as gasoline, avg(gazole_prix) as diesel");
    url.searchParams.set("limit", "1");
    const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { results?: { gasoline: number | null; diesel: number | null }[] };
    const row = data.results?.[0];
    const round = (v: number | null | undefined) => (v ? Math.round(Number(v) * 1000) / 1000 : null);
    const prices = { gasoline: round(row?.gasoline), diesel: round(row?.diesel), updated_at: new Date().toISOString() };
    cache = { at: Date.now(), prices };
    return prices;
  } catch (err) {
    console.error("Error fetching fuel prices:", err);
    // Keep serving the last known prices if the API is temporarily down
    return cache?.prices ?? { gasoline: null, diesel: null, updated_at: null };
  }
}

router.get("/", async (_req: Request, res: Response) => {
  res.json(await getFranceAverages());
});

export default router;
