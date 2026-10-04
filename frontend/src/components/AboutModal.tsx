import { useEffect, useRef } from "react";
import { X, Sparkles, Calculator, ShieldCheck, Heart } from "lucide-react";
import { useTranslation } from "../i18n/LanguageContext";

const AUTHOR_GITHUB = "https://github.com/Zi0u";
const REPO_URL = "https://github.com/Zi0u/teslamate-modern-dashboard";

// Long-form content of the "About" dialog, in both languages
// (kept here rather than in translations.ts because it's structured: lists of title + text)
const CONTENT = {
  fr: {
    title: "À propos",
    intro:
      "TeslaMate Modern Dashboard est un tableau de bord moderne pour TeslaMate. Il se connecte en lecture seule à la base PostgreSQL de votre TeslaMate (il ne modifie jamais rien) et rassemble l'essentiel de votre Tesla sur une seule page.",
    featuresTitle: "Fonctionnalités",
    features: [
      ["Position en temps réel", "carte OpenStreetMap qui suit la voiture pendant les trajets, avec la météo du lieu."],
      ["Charge en cours", "bandeau en direct : niveau, énergie, puissance, températures."],
      ["Dernière charge", "énergie, coût, puissance, autonomie gagnée, et économies par rapport à une voiture essence ou diesel."],
      [
        "Statistiques",
        "distance, consommation, énergie, coût et économies vs essence / diesel sur la semaine, le mois, le mois précédent ou l'année.",
      ],
      ["Batterie", "santé de la batterie, historique de niveau et consommation sur 7 jours."],
      ["Trajets", "10 derniers trajets, destinations favorites et activité sur 30 jours."],
      ["Multi-véhicules, FR / EN", "et un mode démo sans base de données."],
      [
        "Voitures vendues ou inactives",
        "désactivez leur collecte dans TeslaMate (Settings → la voiture → Enabled) : elles sont masquées du dashboard, leur historique reste intact.",
      ],
    ],
    calcTitle: "Comment sont faits les calculs",
    calcs: [
      [
        "Consommation",
        "énergie utilisée (autonomie idéale perdue × efficacité de la voiture) ÷ distance parcourue. Les moyennes sont pondérées par la distance : un long trajet compte plus qu'un petit.",
      ],
      ["Km réels", "énergie ajoutée par la charge ÷ votre consommation moyenne des 30 derniers jours."],
      [
        "Économies vs thermique",
        "km réels × 6,5 L/100 km (essence) ou 5,5 L/100 km (diesel) × prix du carburant, moins le coût des charges. Prix : moyenne nationale France (open data prix-carburants, data.economie.gouv.fr) pour les charges en France, ou vos propres prix (bouton « Prix »). Sur une période, seules les charges dont le coût est renseigné sont comptées.",
      ],
      [
        "Santé de la batterie",
        "capacité actuelle (moyenne des 100 dernières mesures) ÷ capacité maximale observée, comme le dashboard Grafana de TeslaMate.",
      ],
      [
        "Coûts",
        "ceux renseignés dans TeslaMate (tarifs des geo-fences). Les charges sans coût sont signalées. La devise affichée se choisit dans la fenêtre « Prix » (symbole seulement, sans conversion).",
      ],
      ["Jours et mois", "découpés à minuit dans le fuseau horaire de votre navigateur."],
    ],
    privacyTitle: "Vos données",
    privacy:
      "Les données restent sur votre serveur. Seuls la météo (Open-Meteo), les tuiles de carte (OpenStreetMap) et les prix moyens des carburants viennent de services externes, sans aucune donnée personnelle. Vos prix de carburant personnalisés sont enregistrés uniquement dans votre navigateur.",
    madeBy: "Projet open source (licence MIT) créé par",
    repo: "Code source sur GitHub",
    thanks: "Construit autour de TeslaMate, merci à toute sa communauté.",
    close: "Fermer",
  },
  en: {
    title: "About",
    intro:
      "TeslaMate Modern Dashboard is a modern dashboard for TeslaMate. It connects read-only to your TeslaMate PostgreSQL database (it never changes anything) and brings the essentials of your Tesla together on a single page.",
    featuresTitle: "Features",
    features: [
      ["Real-time position", "OpenStreetMap map that follows the car while driving, with the local weather."],
      ["Live charging", "live banner: level, energy, power, temperatures."],
      ["Last charge", "energy, cost, power, range gained, and savings compared to a gasoline or diesel car."],
      [
        "Statistics",
        "distance, consumption, energy, cost and savings vs gasoline / diesel for the week, the month, the previous month or the year.",
      ],
      ["Battery", "battery health, 7-day level history and consumption."],
      ["Drives", "last 10 drives, top destinations and 30-day activity."],
      ["Multiple cars, FR / EN", "and a demo mode with no database needed."],
      [
        "Sold or inactive cars",
        "disable their data collection in TeslaMate (Settings → the car → Enabled): they are hidden from the dashboard, their history stays intact.",
      ],
    ],
    calcTitle: "How things are calculated",
    calcs: [
      [
        "Consumption",
        "energy used (ideal range lost × the car's efficiency) ÷ distance driven. Averages are distance-weighted: a long drive counts more than a short one.",
      ],
      ["Real km", "energy added by the charge ÷ your average consumption over the last 30 days."],
      [
        "Savings vs combustion",
        "real km × 6.5 L/100 km (gasoline) or 5.5 L/100 km (diesel) × fuel price, minus the cost of the charges. Prices: French national average (prix-carburants open data, data.economie.gouv.fr) for charges in France, or your own prices (\"Prices\" button). Over a period, only charges with a cost set are counted.",
      ],
      [
        "Battery health",
        "current capacity (average of the last 100 readings) ÷ highest capacity observed, like TeslaMate's Grafana dashboard.",
      ],
      [
        "Costs",
        "the ones set in TeslaMate (geo-fence prices). Charges without a cost are flagged. The displayed currency is picked in the \"Prices\" dialog (symbol only, no conversion).",
      ],
      ["Days and months", "cut at midnight in your browser's time zone."],
    ],
    privacyTitle: "Your data",
    privacy:
      "Your data stays on your server. Only the weather (Open-Meteo), map tiles (OpenStreetMap) and average fuel prices come from external services, with no personal data sent. Your custom fuel prices are stored only in your browser.",
    madeBy: "Open source project (MIT license) made by",
    repo: "Source code on GitHub",
    thanks: "Built around TeslaMate, thanks to its whole community.",
    close: "Close",
  },
} as const;

function Section({ icon: Icon, title, children }: { icon: typeof Sparkles; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </h3>
      {children}
    </section>
  );
}

export function AboutModal({ onClose }: { onClose: () => void }) {
  const { locale } = useTranslation();
  const c = CONTENT[locale];
  const closeRef = useRef<HTMLButtonElement>(null);

  // Close with Escape, focus the close button, and lock the page scroll while open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-title"
        className="flex max-h-[85vh] w-full max-w-2xl flex-col rounded-xl border bg-card text-card-foreground shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b px-6 py-4">
          <div>
            <h2 id="about-title" className="text-lg font-semibold">
              {c.title}
            </h2>
            <p className="text-xs text-muted-foreground">
              TeslaMate Modern Dashboard · v{__APP_VERSION__}
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label={c.close}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-6 overflow-y-auto px-6 py-5 text-sm">
          <p className="leading-relaxed text-foreground/90">{c.intro}</p>

          <Section icon={Sparkles} title={c.featuresTitle}>
            <ul className="space-y-1.5 text-muted-foreground">
              {c.features.map(([name, text]) => (
                <li key={name}>
                  <span className="font-medium text-foreground">{name}</span>
                  {locale === "fr" ? " : " : ": "}
                  {text}
                </li>
              ))}
            </ul>
          </Section>

          <Section icon={Calculator} title={c.calcTitle}>
            <dl className="space-y-2.5">
              {c.calcs.map(([name, text]) => (
                <div key={name} className="rounded-lg border bg-muted/30 px-3 py-2">
                  <dt className="font-medium text-foreground">{name}</dt>
                  <dd className="text-muted-foreground">{text}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section icon={ShieldCheck} title={c.privacyTitle}>
            <p className="leading-relaxed text-muted-foreground">{c.privacy}</p>
          </Section>
        </div>

        {/* Footer: author + source */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4 text-xs text-muted-foreground">
          <div className="space-y-1">
            <p className="flex flex-wrap items-center gap-1.5">
              <Heart className="h-3.5 w-3.5 text-red-400" />
              {c.madeBy}
              <a
                href={AUTHOR_GITHUB}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-primary"
              >
                <img src="/logo-github.png" alt="" className="h-3.5 w-3.5 rounded-sm bg-white p-[1px]" />
                Martin
              </a>
            </p>
            <p className="text-[11px] text-muted-foreground/80">{c.thanks}</p>
          </div>
          <a
            href={REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 font-medium text-foreground transition-colors hover:border-primary/70 hover:bg-primary/20"
          >
            {c.repo}
          </a>
        </div>
      </div>
    </div>
  );
}
