export type TemperatureUnit = "celsius" | "fahrenheit";
export interface City { id: number; name: string; country: string; admin1?: string; latitude: number; longitude: number; timezone?: string; }
export interface GeocodingResponse { results?: City[]; }
export interface ForecastResponse {
  timezone: string;
  current: { time: string; temperature_2m: number; relative_humidity_2m: number; apparent_temperature: number; is_day: number; precipitation: number; weather_code: number; wind_speed_10m: number };
  hourly: { time: string[]; temperature_2m: number[]; precipitation_probability: number[]; weather_code: number[] };
  daily: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max: number[]; sunrise: string[]; sunset: string[]; uv_index_max: number[] };
}
export interface WeatherCondition { label: string; icon: "sun" | "cloud" | "cloud-sun" | "cloud-rain" | "cloud-snow" | "cloud-lightning" | "cloud-fog"; detail: string; }
export interface SavedCity { id: number; name: string; country: string; latitude: number; longitude: number; timezone?: string; }
