import type { City, ForecastResponse, GeocodingResponse, TemperatureUnit, WeatherCondition } from "../types/weather";
const GEO = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST = "https://api.open-meteo.com/v1/forecast";

export async function searchCities(query: string, signal?: AbortSignal): Promise<City[]> {
  const params = new URLSearchParams({ name: query.trim(), count: "6", language: "en", format: "json" });
  const response = await fetch(`${GEO}?${params}`, { signal });
  if (!response.ok) throw new Error("City search is unavailable right now.");
  const data = (await response.json()) as GeocodingResponse;
  return (data.results ?? []).map((city) => ({ ...city }));
}

export async function getForecast(city: Pick<City, "latitude" | "longitude">, signal?: AbortSignal): Promise<ForecastResponse> {
  const params = new URLSearchParams({
    latitude: String(city.latitude), longitude: String(city.longitude),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m",
    hourly: "temperature_2m,precipitation_probability,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,sunrise,sunset,uv_index_max",
    forecast_days: "7", timezone: "auto",
  });
  const response = await fetch(`${FORECAST}?${params}`, { signal });
  if (!response.ok) throw new Error("Couldn't load the forecast. Please try again.");
  return (await response.json()) as ForecastResponse;
}

export function getWeatherCondition(code: number): WeatherCondition {
  if (code === 0) return { label: "Clear sky", icon: "sun", detail: "A little sunshine goes a long way." };
  if (code === 1) return { label: "Mainly clear", icon: "cloud-sun", detail: "Mostly clear with a few clouds." };
  if (code === 2) return { label: "Partly cloudy", icon: "cloud-sun", detail: "A mix of sun and clouds." };
  if (code === 3) return { label: "Overcast", icon: "cloud", detail: "A blanket of clouds overhead." };
  if ([45, 48].includes(code)) return { label: "Foggy", icon: "cloud-fog", detail: "Take it easy in reduced visibility." };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Rain showers", icon: "cloud-rain", detail: "An umbrella might be a good idea." };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Snowfall", icon: "cloud-snow", detail: "Bundle up before heading out." };
  if ([95, 96, 99].includes(code)) return { label: "Thunderstorm", icon: "cloud-lightning", detail: "Stay aware of changing conditions." };
  return { label: "Changing conditions", icon: "cloud", detail: "Check back soon for the latest." };
}
export function formatTemperature(value: number, unit: TemperatureUnit): number { return Math.round(unit === "celsius" ? value : value * 9 / 5 + 32); }
export function formatHour(value: string, _timezone: string): string { const hour = Number(value.slice(11, 13)); return `${hour % 12 || 12}${hour < 12 ? "AM" : "PM"}`; }
export function formatWeekday(value: string, _timezone: string): string { return new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "UTC" }).format(new Date(`${value}T12:00:00Z`)); }
export function getUvLabel(value: number): string { if (value < 3) return "Low"; if (value < 6) return "Moderate"; if (value < 8) return "High"; if (value < 11) return "Very high"; return "Extreme"; }
