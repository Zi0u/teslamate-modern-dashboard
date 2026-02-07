import { useGrafanaUrl } from "../hooks/useApi";

const grafanaLinks = [
  { uid: "kOuP_Fggz", label: "Overview" },
  { uid: "jchmRiqUfXgTM", label: "Battery Health" },
  { uid: "WopVO_mgz", label: "Charge Level" },
  { uid: "TSmNYvRRk", label: "Charges" },
  { uid: "-pkIkhmRz", label: "Charging Stats" },
  { uid: "Y8upc6ZRk", label: "Drives" },
  { uid: "_7WkNSyWk", label: "Drive Stats" },
  { uid: "fu4SiQgWz", label: "Efficiency" },
  { uid: "ZzhF-aRWz", label: "Locations" },
  { uid: "NjtMTFggz", label: "Mileage" },
  { uid: "riqUfXgRz", label: "Projected Range" },
  { uid: "xo4BNRkZz", label: "States" },
  { uid: "1EZnXszMk", label: "Statistics" },
  { uid: "SUBgwtigz", label: "Timeline" },
  { uid: "FkUpJpQZk", label: "Trip" },
  { uid: "IiC07mgWz", label: "Updates" },
  { uid: "zhHx2Fggk", label: "Vampire Drain" },
  { uid: "RG_DxSmgk", label: "Visited" },
  { uid: "jchmDbInfo", label: "Database Info" },
];

export function GrafanaNav() {
  const { data } = useGrafanaUrl();
  const baseUrl = data?.grafana_url;

  if (!baseUrl) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t z-50">
      <div className="px-4 py-2 overflow-x-auto">
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground mr-2 shrink-0 flex items-center gap-1.5">
            <img src="/grafana-logo.png" alt="Grafana" className="h-4 w-4" />
            Grafana
          </span>
          {grafanaLinks.map((link) => (
            <a
              key={link.uid}
              href={`${baseUrl}/d/${link.uid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2 py-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
