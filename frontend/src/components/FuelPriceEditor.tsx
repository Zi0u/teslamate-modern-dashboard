import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Info, X, Fuel as FuelIcon } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";
import { FUEL_DATA_URL, FUELS, parsePrice, useCustomFuelPrices, type CustomPrices, type Fuel } from "../lib/fuel";

// Dialog to set the viewer's own fuel prices (saved in this browser). Shared by the last charge
// "Savings" tab and the stats card: saving here updates both right away (useCustomFuelPrices).
// `placeholders`: automatic prices shown as hints (French average when it applies).
// Rendered in a portal on <body> so it sits above every card.
export function FuelPriceEditor({
  placeholders,
  onDone,
}: {
  placeholders: Partial<Record<Fuel, number | null>>;
  onDone: () => void;
}) {
  const { locale, t } = useTranslation();
  const [customPrices, saveCustomPrices] = useCustomFuelPrices();
  const numLocale = locale === "fr" ? "fr-FR" : "en-GB";
  const format = (value: number) =>
    value.toLocaleString(numLocale, { minimumFractionDigits: 3, maximumFractionDigits: 3 });
  const [draft, setDraft] = useState<Record<Fuel, string>>({
    gasoline: customPrices.gasoline != null ? format(customPrices.gasoline) : "",
    diesel: customPrices.diesel != null ? format(customPrices.diesel) : "",
  });
  const hasCustom = Object.keys(customPrices).length > 0;
  // A non-empty field that isn't a valid price blocks saving (instead of silently dropping it)
  const invalid = (f: Fuel) => draft[f].trim() !== "" && parsePrice(draft[f]) === undefined;
  const hasInvalid = FUELS.some(invalid);

  // Close with Escape, focus the first field, and lock the page scroll while open
  // (once on open: the parent cards re-render on every data refresh, which must not steal focus)
  const firstInputRef = useRef<HTMLInputElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onDoneRef.current();
    document.addEventListener("keydown", onKey);
    firstInputRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, []);

  const save = () => {
    const next: CustomPrices = {};
    for (const f of FUELS) {
      const price = parsePrice(draft[f]);
      if (price) next[f] = price;
    }
    saveCustomPrices(next);
    onDone();
  };

  const reset = () => {
    saveCustomPrices({});
    onDone();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onDone()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="fuel-prices-title"
        className="w-full max-w-sm rounded-xl border bg-card text-card-foreground shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 border-b px-5 py-3.5">
          <h2 id="fuel-prices-title" className="flex items-center gap-2 text-base font-semibold">
            <FuelIcon className="h-4 w-4 text-primary" />
            {t("charge.fuelPricesTitle")}
          </h2>
          <button
            onClick={onDone}
            aria-label={t("charge.fuelClose")}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-3 px-5 py-4">
          {/* Where prices come from: automatic French average by default, the viewer's own otherwise */}
          <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/10 p-2.5 text-xs text-foreground/90">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <ul className="space-y-1.5">
              <li>
                <span className="font-semibold">{t("charge.fuelSourceAutoTitle")}</span> {t("charge.fuelSourceAuto")}{" "}
                <a
                  href={FUEL_DATA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-dotted underline-offset-2 hover:text-primary"
                >
                  data.economie.gouv.fr
                </a>
                {t("charge.fuelSourceAutoEnd")}
              </li>
              <li>
                <span className="font-semibold">{t("charge.fuelSourceCustomTitle")}</span> {t("charge.fuelSourceCustom")}
              </li>
            </ul>
          </div>
          {FUELS.map((f, i) => (
            <label key={f} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex flex-col">
                <span className="text-foreground">{t(f === "gasoline" ? "charge.gasoline" : "charge.diesel")}</span>
                {/* The automatic price this field overrides */}
                <span className="text-[11px] text-muted-foreground">
                  {placeholders[f] != null
                    ? `${t("charge.fuelAutoPrice")} ${format(placeholders[f]!)} €/L`
                    : t("charge.fuelNoAutoPrice")}
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <input
                  ref={i === 0 ? firstInputRef : undefined}
                  type="text"
                  inputMode="decimal"
                  value={draft[f]}
                  onChange={(e) => setDraft({ ...draft, [f]: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && !hasInvalid && save()}
                  placeholder={placeholders[f] != null ? format(placeholders[f]!) : "—"}
                  aria-invalid={invalid(f)}
                  className={`w-24 rounded-md border bg-background px-2 py-1.5 text-right text-sm tabular-nums focus:outline-none focus:ring-1 ${
                    invalid(f) ? "border-red-500 focus:ring-red-500" : "focus:ring-primary"
                  }`}
                />
                <span className="text-muted-foreground">€/L</span>
              </span>
            </label>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 border-t px-5 py-3">
          {hasCustom && (
            <button
              onClick={reset}
              className="mr-auto rounded-md px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
            >
              {t("charge.fuelReset")}
            </button>
          )}
          <button
            onClick={onDone}
            className="rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
          >
            {t("charge.fuelCancel")}
          </button>
          <button
            onClick={save}
            disabled={hasInvalid}
            className="rounded-md bg-primary px-3.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("charge.fuelSave")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
