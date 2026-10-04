import { useEffect, useState } from "react";

// Shared by the last charge "Savings" tab and the stats card

// Typical consumption of an equivalent combustion car (L/100km)
export const FUEL_CONSUMPTION = { gasoline: 6.5, diesel: 5.5 } as const;
export const FUELS = ["gasoline", "diesel"] as const;
// Same color for a fuel everywhere (cost bars, savings boxes, stats)
export const FUEL_COLOR = { gasoline: "bg-green-500", diesel: "bg-yellow-400" } as const;
export type Fuel = (typeof FUELS)[number];
export type CustomPrices = Partial<Record<Fuel, number>>;

// Official French open data the national average comes from (fetched by the backend, cached 6h)
export const FUEL_DATA_URL =
  "https://data.economie.gouv.fr/explore/dataset/prix-des-carburants-en-france-flux-instantane-v2/";

// The viewer's own fuel prices, kept in this browser only (localStorage survives restarts)
const PRICES_STORAGE_KEY = "lastCharge.fuelPrices";
// Notifies the other components of this tab when the prices change
const PRICES_CHANGED_EVENT = "fuel-prices-changed";

function readCustomPrices(): CustomPrices {
  try {
    const raw = localStorage.getItem(PRICES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomPrices) : {};
  } catch {
    return {};
  }
}

function writeCustomPrices(prices: CustomPrices) {
  try {
    if (Object.keys(prices).length) localStorage.setItem(PRICES_STORAGE_KEY, JSON.stringify(prices));
    else localStorage.removeItem(PRICES_STORAGE_KEY);
  } catch {
    // storage unavailable (private mode): prices just aren't remembered
  }
  window.dispatchEvent(new Event(PRICES_CHANGED_EVENT));
}

// The viewer's custom prices, kept in sync between components (and browser tabs)
export function useCustomFuelPrices(): [CustomPrices, (prices: CustomPrices) => void] {
  const [prices, setPrices] = useState<CustomPrices>(readCustomPrices);

  useEffect(() => {
    const refresh = () => setPrices(readCustomPrices());
    window.addEventListener(PRICES_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(PRICES_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return [prices, writeCustomPrices];
}

export function parsePrice(value: string): number | undefined {
  const n = Number(value.replace(",", ".").trim());
  return value.trim() && Number.isFinite(n) && n > 0 && n < 100 ? n : undefined;
}
