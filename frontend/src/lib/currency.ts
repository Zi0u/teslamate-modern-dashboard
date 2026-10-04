import { useEffect, useState } from "react";

// Currency used to display costs. TeslaMate stores costs without a currency (they are whatever the
// user typed in the geo-fence prices), so this only changes the symbol: no conversion.
export const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD"] as const;
export type Currency = (typeof CURRENCIES)[number];

// Kept in this browser only; notifies the other components of this tab when it changes
const CURRENCY_STORAGE_KEY = "dashboard.currency";
const CURRENCY_CHANGED_EVENT = "currency-changed";

function readCurrency(): Currency {
  try {
    const value = localStorage.getItem(CURRENCY_STORAGE_KEY);
    return (CURRENCIES as readonly string[]).includes(value ?? "") ? (value as Currency) : "EUR";
  } catch {
    return "EUR";
  }
}

function writeCurrency(currency: Currency) {
  try {
    localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
  } catch {
    // storage unavailable (private mode): the choice just isn't remembered
  }
  window.dispatchEvent(new Event(CURRENCY_CHANGED_EVENT));
}

export function useCurrency(): [Currency, (currency: Currency) => void] {
  const [currency, setCurrency] = useState<Currency>(readCurrency);

  useEffect(() => {
    const refresh = () => setCurrency(readCurrency());
    window.addEventListener(CURRENCY_CHANGED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(CURRENCY_CHANGED_EVENT, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  return [currency, writeCurrency];
}

// "12,50 €" / "€12.50" / "12,50 $" / "$12.50": symbol placed the way the UI language expects
export function formatMoney(value: number, numLocale: string, currency: Currency, digits = 2): string {
  return value.toLocaleString(numLocale, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

// Symbol alone, for units like "€/L" or "$/kWh"
export function currencySymbol(currency: Currency, numLocale: string): string {
  return (
    new Intl.NumberFormat(numLocale, { style: "currency", currency, currencyDisplay: "narrowSymbol" })
      .formatToParts(0)
      .find((p) => p.type === "currency")?.value ?? currency
  );
}
