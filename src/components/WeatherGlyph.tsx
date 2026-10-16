import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from "lucide-react";
import type { WeatherCondition } from "../types/weather";
export default function WeatherGlyph({ icon, size = 28, className }: { icon: WeatherCondition["icon"]; size?: number; className?: string }) {
  const props = { size, strokeWidth: 1.65, className };
  switch (icon) {
    case "sun": return <Sun {...props} />;
    case "cloud-sun": return <CloudSun {...props} />;
    case "cloud-rain": return <CloudRain {...props} />;
    case "cloud-snow": return <CloudSnow {...props} />;
    case "cloud-lightning": return <CloudLightning {...props} />;
    case "cloud-fog": return <CloudFog {...props} />;
    default: return <Cloud {...props} />;
  }
}
