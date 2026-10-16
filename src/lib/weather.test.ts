import { describe, expect, it } from "vitest";
import { formatTemperature, getUvLabel, getWeatherCondition } from "./weather";
describe("getWeatherCondition", () => {
  it("describes clear weather", () => { expect(getWeatherCondition(0).label).toBe("Clear sky"); expect(getWeatherCondition(0).icon).toBe("sun"); });
  it("groups rain and thunderstorm codes", () => { expect(getWeatherCondition(63).icon).toBe("cloud-rain"); expect(getWeatherCondition(95).label).toBe("Thunderstorm"); });
});
describe("formatTemperature", () => {
  it("rounds Celsius", () => { expect(formatTemperature(18.6, "celsius")).toBe(19); });
  it("converts Celsius to Fahrenheit", () => { expect(formatTemperature(0, "fahrenheit")).toBe(32); expect(formatTemperature(20, "fahrenheit")).toBe(68); });
});
describe("getUvLabel", () => { it("returns useful risk labels", () => { expect(getUvLabel(1)).toBe("Low"); expect(getUvLabel(5)).toBe("Moderate"); expect(getUvLabel(9)).toBe("Very high"); }); });
