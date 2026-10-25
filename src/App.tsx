import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Check, ChevronDown, CloudSun, Compass, Droplets, LocateFixed, MapPin, Moon, Search, Sun, Sunrise, Sunset, Thermometer, Wind, X, Star } from "lucide-react";
import WeatherGlyph from "./components/WeatherGlyph";
import { formatHour, formatTemperature, formatWeekday, getForecast, getUvLabel, getWeatherCondition, searchCities } from "./lib/weather";
import type { City, ForecastResponse, SavedCity, TemperatureUnit } from "./types/weather";

const DEFAULT_CITY: City = { id: 112931, name: "Tehran", country: "Iran", latitude: 35.6944, longitude: 51.4215, timezone: "Asia/Tehran" };
const SAVED_KEY = "atmos-saved-cities";
const THEME_KEY = "atmos-theme";
function readSaved(): SavedCity[] { try { return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]") as SavedCity[]; } catch { return []; } }
function readTheme(): "light" | "dark" { try { return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark"; } catch { return "dark"; } }
function greeting(hour: number) { return hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"; }
function localHour(timezone: string) { return Number(new Intl.DateTimeFormat("en", { hour: "numeric", hourCycle: "h23", timeZone: timezone }).format(new Date())); }
function clock(value: string, _timezone: string) { const [hourText, minute] = value.slice(11, 16).split(":"); const hour = Number(hourText); return `${hour % 12 || 12}:${minute} ${hour < 12 ? "AM" : "PM"}`; }

export default function App() {
  const [page, setPage] = useState(() => new URLSearchParams(window.location.search).get("page") ?? "home");
  useEffect(() => {
    const syncPage = () => setPage(new URLSearchParams(window.location.search).get("page") ?? "home");
    window.addEventListener("popstate", syncPage);
    document.documentElement.dataset.page = page;
    return () => window.removeEventListener("popstate", syncPage);
  }, [page]);
  const navigatePage = (nextPage: string) => {
    const url = new URL(window.location.href);
    if (nextPage === "home") url.searchParams.delete("page"); else url.searchParams.set("page", nextPage);
    window.history.pushState({}, "", url);
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const [city, setCity] = useState<City>(DEFAULT_CITY);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState<TemperatureUnit>("celsius");
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [savedCities, setSavedCities] = useState<SavedCity[]>(readSaved);
  const [theme, setTheme] = useState<"light" | "dark">(readTheme);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const loadForecast = useCallback(async (selected: City, signal?: AbortSignal) => {
    setLoading(true); setError("");
    try { const data = await getForecast(selected, signal); if (!signal?.aborted) { setForecast(data); setLastUpdated(new Date()); } }
    catch (reason) { if (!signal?.aborted) setError(reason instanceof Error ? reason.message : "Something went wrong while loading the weather."); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, []);
  useEffect(() => { const controller = new AbortController(); void loadForecast(city, controller.signal); return () => controller.abort(); }, [city, loadForecast]);
  useEffect(() => { document.documentElement.dataset.theme = theme; try { localStorage.setItem(THEME_KEY, theme); } catch { /* Storage is optional. */ } }, [theme]);
  useEffect(() => { try { localStorage.setItem(SAVED_KEY, JSON.stringify(savedCities)); } catch { /* Storage is optional. */ } }, [savedCities]);
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) { setSuggestions([]); setSearchError(""); setSearching(false); return; }
    const controller = new AbortController(); setSearching(true);
    const timer = window.setTimeout(async () => {
      try { const results = await searchCities(term, controller.signal); setSuggestions(results); setSearchError(results.length ? "" : "No places found. Try another spelling."); }
      catch (reason) { if (!controller.signal.aborted) { setSearchError(reason instanceof Error ? reason.message : "Search is unavailable."); setSuggestions([]); } }
      finally { if (!controller.signal.aborted) setSearching(false); }
    }, 300);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [query]);

  const condition = forecast ? getWeatherCondition(forecast.current.weather_code) : getWeatherCondition(0);
  useEffect(() => { document.documentElement.dataset.weather = condition.icon; }, [condition.icon]);
  const timezone = forecast?.timezone ?? city.timezone ?? "UTC";
  const now = forecast?.current.time ?? new Date().toISOString();
  const hourly = useMemo(() => {
    if (!forecast) return [];
    const start = Math.max(0, forecast.hourly.time.findIndex((time) => time >= forecast.current.time));
    return forecast.hourly.time.slice(start, start + 8).map((time, index) => ({ time, temperature: forecast.hourly.temperature_2m[start + index], rain: forecast.hourly.precipitation_probability[start + index], code: forecast.hourly.weather_code[start + index] }));
  }, [forecast]);
  const days = useMemo(() => forecast ? forecast.daily.time.map((date, index) => ({ date, code: forecast.daily.weather_code[index], high: forecast.daily.temperature_2m_max[index], low: forecast.daily.temperature_2m_min[index], rain: forecast.daily.precipitation_probability_max[index] })) : [], [forecast]);
  const visibleDays = days;
  const minTemp = days.length ? Math.min(...days.map((day) => day.low)) : 0;
  const savedCurrent = savedCities.some((item) => item.id === city.id);

  function chooseCity(next: City) { setCity(next); setQuery(""); setSuggestions([]); setSearchError(""); searchRef.current?.blur(); }
  function toggleSaved() {
    if (savedCurrent) { setSavedCities((items) => items.filter((item) => item.id !== city.id)); return; }
    if (savedCities.length >= 10) { setSearchError("You can save up to 10 places. Remove one to add another."); return; }
    const item: SavedCity = { id: city.id, name: city.name, country: city.country, latitude: city.latitude, longitude: city.longitude, timezone: city.timezone };
    setSavedCities((items) => [item, ...items].slice(0, 10));
  }
  function useLocation() {
    if (!navigator.geolocation) { setError("Your browser doesn't support location access. Search for a city instead."); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(({ coords }) => {
      chooseCity({ ...DEFAULT_CITY, id: -1, name: "Your location", country: "Current location", latitude: coords.latitude, longitude: coords.longitude });
    }, () => { setLoading(false); setError("Location access was blocked. You can still search for any city."); }, { enableHighAccuracy: false, timeout: 8000 });
  }

  return <main className="app-shell">
    <aside className="blue-sidebar" aria-label="Main navigation">
      <button className="blue-brand" onClick={() => navigatePage("home")}><span className="blue-brand-mark"><CloudSun size={23}/></span><span>ATMOS<span>.</span></span></button>
      <span className="blue-nav-kicker">WEATHER STATION</span>
      <nav className="blue-nav">
        <button className={page === "home" ? "active" : ""} onClick={() => navigatePage("home")}><CloudSun size={18}/><span>Overview</span><i>01</i></button>
        <button className={page === "conditions" ? "active" : ""} onClick={() => navigatePage("conditions")}><Compass size={18}/><span>Conditions</span><i>02</i></button>
        <button className={page === "hourly" ? "active" : ""} onClick={() => navigatePage("hourly")}><Wind size={18}/><span>Hourly forecast</span><i>03</i></button>
        <button className={page === "weekly" ? "active" : ""} onClick={() => navigatePage("weekly")}><Sunrise size={18}/><span>7-day forecast</span><i>04</i></button>
        <button className={page === "saved" ? "active" : ""} onClick={() => navigatePage("saved")}><MapPin size={18}/><span>Saved places</span><i>05</i></button>
      </nav>
      <div className="blue-sidebar-note"><span>✳</span><strong>SKY NOTES</strong><p>A little clarity for whatever the weather brings.</p><small>ATMOS / FIELD LOG 01</small></div>
    </aside>
    <div className="ambient ambient-one" /><div className="ambient ambient-two" />
    <div className="weather-atmosphere" aria-hidden="true">
      <div className="weather-glow" />
      <div className="weather-rain"><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/><i/></div>
      <div className="weather-snow"><i>✳</i><i>✧</i><i>❄</i><i>✳</i><i>✧</i><i>❄</i><i>✳</i><i>❄</i></div>
      <div className="weather-sunflare" />
      <div className="weather-lightning" />
      <div className="weather-fog"><i/><i/><i/></div>
    </div>
    <header className="topbar">
      <div className="topbar-right">
        <div className="search-wrap"><Search size={17} className="search-icon" /><input ref={searchRef} aria-label="Search city" value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && suggestions[0]) chooseCity(suggestions[0]); if (event.key === "Escape") { setQuery(""); setSuggestions([]); } }} placeholder="Search a city..." autoComplete="off" />
          {query && <button className="clear-search" aria-label="Clear search" onClick={() => { setQuery(""); setSuggestions([]); }}><X size={15} /></button>}
          {query.trim().length >= 2 && (suggestions.length > 0 || searching || searchError) && <div className="suggestion-menu">{searching && <div className="suggestion-message">Finding places…</div>}{!searching && searchError && <div className="suggestion-message">{searchError}</div>}{!searching && suggestions.map((item) => <button key={`${item.id}-${item.latitude}`} className="suggestion-item" onClick={() => chooseCity(item)}><MapPin size={16} /><span><strong>{item.name}</strong><small>{[item.admin1, item.country].filter(Boolean).join(", ")}</small></span></button>)}</div>}
        </div>
        <div className="unit-switch topbar-unit-switch" role="group" aria-label="Temperature unit">
          <button className={unit === "celsius" ? "active" : ""} onClick={() => setUnit("celsius")} aria-pressed={unit === "celsius"} aria-label="Use Celsius">°C</button>
          <button className={unit === "fahrenheit" ? "active" : ""} onClick={() => setUnit("fahrenheit")} aria-pressed={unit === "fahrenheit"} aria-label="Use Fahrenheit">°F</button>
        </div>
        <button className="icon-button location-button" onClick={useLocation} title="Use my location" aria-label="Use my location"><LocateFixed size={18} /></button>
        <button className="icon-button theme-button" onClick={() => setTheme((value) => value === "dark" ? "light" : "dark")} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} aria-label="Toggle theme">{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}</button>
      </div>
    </header>

    <section className="welcome-row"><div><p className="eyebrow">{greeting(localHour(timezone))} <span className="greeting-spark">✳</span></p><h1>Weather, with a little<br className="desktop-break" /> more <span>clarity.</span></h1><p className="welcome-copy">A calmer way to check the sky and plan your day.</p></div><div className="date-block"><span className="date-label">YOUR LOCAL FORECAST</span><strong>{new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${now.slice(0, 10)}T12:00:00Z`))}</strong><span className="updated-line">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Live forecast"}</span></div></section>
    <div className="page-title-strip" aria-live="polite">
      <span className="page-title-spark">✦</span>
      <span>{({ home: "TODAY'S SKY", conditions: "WEATHER FIELD NOTES", hourly: "THE HOURS AHEAD", weekly: "THE WEEK IN WEATHER", saved: "YOUR PLACES" } as Record<string, string>)[page] ?? "TODAY'S SKY"}</span>
      <span className="page-title-rule" />
      <span className="page-city">{city.name}, {city.country}</span>
    </div>
    {error && <div className="error-banner" role="alert"><span>{error}</span><button onClick={() => void loadForecast(city)}>Try again</button><button aria-label="Dismiss error" onClick={() => setError("")}><X size={16} /></button></div>}

    <section id="home" className="hero-grid page-section" aria-label="Current weather">
      <article key={city.id} className="current-card panel"><div className="card-topline"><div className="place-heading"><MapPin size={15} /><span>{city.name}</span><span className="place-country">{city.country}</span></div><button className={`save-button ${savedCurrent ? "is-saved" : ""}`} onClick={toggleSaved} aria-label={savedCurrent ? "Remove saved city" : "Save city"}>{savedCurrent ? <Check size={15} /> : <span>+</span>} {savedCurrent ? "Saved" : "Save place"}</button></div>
        {loading && !forecast ? <div className="current-loading"><div className="skeleton skeleton-temp" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-line short" /></div> : forecast ? <><div className="current-main"><div className="temperature-block"><div className="temperature">{formatTemperature(forecast.current.temperature_2m, unit)}<span>°{unit === "celsius" ? "C" : "F"}</span></div><p className="condition-label">{condition.label}</p><p className="feels-like">Feels like {formatTemperature(forecast.current.apparent_temperature, unit)}°</p></div><div className="hero-weather-art"><div className="sun-orbit orbit-one" /><div className="sun-orbit orbit-two" /><div className={`weather-orb ${condition.icon}`}><WeatherGlyph icon={condition.icon} size={92} /></div><span className="weather-art-star star-one">✳</span><span className="weather-art-star star-two">✧</span></div></div><div className="condition-note"><span className="note-dot" />{condition.detail}</div><div className="current-footer"><div className="current-stat"><span className="stat-icon"><Wind size={16} /></span><span className="stat-copy"><small>Wind</small><strong>{Math.round(forecast.current.wind_speed_10m)} <em>km/h</em></strong></span></div><div className="current-stat"><span className="stat-icon"><Droplets size={16} /></span><span className="stat-copy"><small>Humidity</small><strong>{forecast.current.relative_humidity_2m}<em>%</em></strong></span></div><div className="current-stat"><span className="stat-icon"><Thermometer size={16} /></span><span className="stat-copy"><small>Feels like</small><strong>{formatTemperature(forecast.current.apparent_temperature, unit)}<em>°</em></strong></span></div></div></> : <div className="fallback-state"><CloudSun size={35} /><strong>Your forecast is taking a breather.</strong><span>Check your connection and try again.</span><button onClick={() => void loadForecast(city)}>Reload weather</button></div>}
      </article>
      <article id="conditions" className="side-card panel page-section"><div className="side-card-header"><div><span className="section-kicker">AT A GLANCE</span><h2>Today's details</h2></div></div>
        {forecast ? <><div className="details-grid"><div className="detail-tile"><span className="detail-icon wind-icon"><Wind size={17} /></span><span className="detail-label">Wind speed</span><strong>{Math.round(forecast.current.wind_speed_10m)} <small>km/h</small></strong><span className="detail-hint">Current conditions</span></div><div className="detail-tile"><span className="detail-icon humidity-icon"><Droplets size={17} /></span><span className="detail-label">Humidity</span><strong>{forecast.current.relative_humidity_2m}<small>%</small></strong><span className="detail-hint">Relative humidity</span></div><div className="detail-tile"><span className="detail-icon uv-icon"><Sun size={17} /></span><span className="detail-label">UV index</span><strong>{Math.round(forecast.daily.uv_index_max[0] ?? 0)} <small>{getUvLabel(forecast.daily.uv_index_max[0] ?? 0)}</small></strong><span className="detail-hint">Today's peak</span></div><div className="detail-tile"><span className="detail-icon rain-icon"><Droplets size={17} /></span><span className="detail-label">Chance of rain</span><strong>{forecast.daily.precipitation_probability_max[0] ?? 0}<small>%</small></strong><span className="detail-hint">Today's outlook</span></div></div><div className="sun-times"><div className="sun-time"><span className="sun-time-icon sunrise"><Sunrise size={18} /></span><span><small>Sunrise</small><strong>{clock(forecast.daily.sunrise[0], timezone)}</strong></span></div><div className="sun-track"><span className="sun-track-line" /><span className="sun-track-dot" /></div><div className="sun-time"><span className="sun-time-icon sunset"><Sunset size={18} /></span><span><small>Sunset</small><strong>{clock(forecast.daily.sunset[0], timezone)}</strong></span></div></div></> : <div className="detail-placeholder">Your weather details will appear here.</div>}
      </article>
    </section>

    <section id="hourly" className="forecast-section panel page-section"><div className="section-heading"><div><span className="section-kicker">THE NEXT FEW HOURS</span><h2>Look ahead</h2></div><span className="section-aside">Hourly forecast <ChevronDown size={14} /></span></div>
      {forecast ? <div className="hourly-strip">{hourly.map((item, index) => { const weather = getWeatherCondition(item.code); return <div className={`hour-item ${index === 0 ? "is-now" : ""}`} key={item.time}><span className="hour-label">{index === 0 ? "Now" : formatHour(item.time, timezone)}</span><div className="hour-icon-wrap"><WeatherGlyph icon={weather.icon} size={23} /></div><strong className="hour-temp">{formatTemperature(item.temperature, unit)}°</strong><span className="hour-rain"><Droplets size={11} />{item.rain}%</span></div>; })}</div> : <div className="detail-placeholder">Hourly forecast will appear here.</div>}
    </section>

    <section className="bottom-grid page-section"><article id="weekly" className="weekly-card panel page-section"><div className="section-heading"><div><span className="section-kicker">PLAN AHEAD</span><h2>7-day forecast</h2></div><span className="section-aside">All 7 days</span></div>
      {forecast ? <div className="week-list">{visibleDays.map((day, index) => { const weather = getWeatherCondition(day.code); const left = Math.max(0, Math.min(75, (day.low - minTemp) * 3)); const width = Math.max(18, Math.min(78, (day.high - day.low) * 3)); return <div className="week-row" key={day.date}><span className="week-day">{index === 0 ? "Today" : formatWeekday(day.date, timezone)}</span><span className="week-condition"><WeatherGlyph icon={weather.icon} size={20} /><small>{weather.label}</small></span><span className="week-rain"><Droplets size={12} />{day.rain}%</span><span className="week-low">{formatTemperature(day.low, unit)}°</span><div className="temp-range"><span style={{ left: `${left}%`, width: `${width}%` }} /></div><strong className="week-high">{formatTemperature(day.high, unit)}°</strong></div>; })}</div> : <div className="detail-placeholder">The weekly forecast will appear here.</div>}
    </article><aside id="saved" className="saved-card panel page-section"><div className="section-heading"><div><span className="section-kicker">YOUR SHORTLIST</span><h2>Saved places</h2></div><span className="saved-count">{savedCities.length}/10</span></div>
      {savedCities.length ? <div className="saved-list">{savedCities.map((saved) => <div className={`saved-row ${saved.id === city.id ? "is-current-place" : ""}`} key={saved.id}><button className="saved-place" onClick={() => chooseCity(saved)} aria-current={saved.id === city.id ? "true" : undefined}><span className="saved-place-icon">{saved.id === city.id ? <Star size={16} fill="currentColor" /> : <MapPin size={16} />}</span><span><strong>{saved.name}{saved.id === city.id && <span className="current-place-label"> CURRENT</span>}</strong><small>{saved.country}</small></span></button><button className="remove-saved" aria-label={`Remove ${saved.name}`} onClick={() => setSavedCities((items) => items.filter((item) => item.id !== saved.id))}><X size={14} /></button></div>)}</div> : <div className="saved-empty"><div className="saved-empty-art"><Compass size={28} /></div><strong>Your places, all in one sky.</strong><p>Save cities you care about to check their forecast in a tap.</p><button onClick={() => searchRef.current?.focus()}>Find a place <ArrowUpRight size={14} /></button></div>}
      <div className="saved-tip"><span className="tip-star">✳</span><span>Small plans start with knowing what's outside.</span></div>
    </aside></section>
    <footer className="footer"><a className="footer-brand" href="#home" onClick={(event) => { event.preventDefault(); chooseCity(DEFAULT_CITY); }}><CloudSun size={17} /> atmos<span>.</span></a><span>Made for slower mornings and smarter plans.</span><span className="data-credit">Weather data by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></span></footer>
  </main>;
}
