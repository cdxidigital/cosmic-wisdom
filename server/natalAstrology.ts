import type { CosmicProfile } from "../drizzle/schema";

const FREE_ASTRO_NATAL_ENDPOINT = "https://api.freeastroapi.com/api/v1/natal/calculate";
const PROVIDER = "FreeAstroAPI";
const VERSION = "natal-calculate-v1";

type ProviderPoint = {
  name?: unknown;
  sign?: unknown;
  pos?: unknown;
  abs_pos?: unknown;
  house?: unknown;
  retrograde?: unknown;
};

type ProviderAspect = {
  p1?: unknown;
  p2?: unknown;
  type?: unknown;
  orb?: unknown;
  deg?: unknown;
  is_major?: unknown;
  is_applying?: unknown;
};

export type NatalPlacement = {
  name: string;
  sign: string;
  degree: number;
  formatted: string;
  house: number | null;
  retrograde: boolean;
};

export type NatalAspect = {
  first: string;
  second: string;
  type: string;
  orb: number | null;
  applying: boolean;
};

export type NatalCalculation = {
  provider: string;
  providerVersion: string;
  calculatedAt: string;
  chartData: Record<string, unknown>;
  readingData: Record<string, unknown>;
  sourceData: Record<string, unknown>;
};

const signFocus: Record<string, string> = {
  Aries: "direct, initiating approach",
  Taurus: "steady, values-led approach",
  Gemini: "curious, connective approach",
  Cancer: "protective, feeling-led approach",
  Leo: "expressive, wholehearted approach",
  Virgo: "practical, discerning approach",
  Libra: "relational, balancing approach",
  Scorpio: "deep, transformative approach",
  Sagittarius: "meaning-seeking, expansive approach",
  Capricorn: "structured, purposeful approach",
  Aquarius: "independent, future-facing approach",
  Pisces: "imaginative, intuitive approach",
};

const signCodes: Record<string, string> = { Ari: "Aries", Tau: "Taurus", Gem: "Gemini", Can: "Cancer", Leo: "Leo", Vir: "Virgo", Lib: "Libra", Sco: "Scorpio", Sag: "Sagittarius", Cap: "Capricorn", Aqu: "Aquarius", Pis: "Pisces" };
const signElements: Record<string, string> = { Aries: "Fire", Leo: "Fire", Sagittarius: "Fire", Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth", Gemini: "Air", Libra: "Air", Aquarius: "Air", Cancer: "Water", Scorpio: "Water", Pisces: "Water" };

function asText(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function asFiniteNumber(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatDegree(value: number) {
  const degrees = Math.floor(value);
  const minutes = Math.round((value - degrees) * 60);
  return `${degrees}°${String(minutes).padStart(2, "0")}′`;
}

function toPlacement(value: ProviderPoint, fallbackName: string): NatalPlacement {
  const degree = asFiniteNumber(value.pos);
  if (degree === null) throw new Error(`The natal provider did not return a valid position for ${fallbackName}.`);
  const name = asText(value.name, fallbackName);
  const rawSign = asText(value.sign, "Unknown sign");
  const sign = signCodes[rawSign] ?? rawSign;
  return {
    name,
    sign,
    degree,
    formatted: `${sign} ${formatDegree(degree)}`,
    house: asFiniteNumber(value.house),
    retrograde: value.retrograde === true,
  };
}

function findPoint(points: ProviderPoint[], name: string) {
  const match = points.find(point => asText(point.name, "").toLowerCase() === name.toLowerCase());
  if (!match) throw new Error(`The natal provider did not return ${name}.`);
  return toPlacement(match, name);
}

function toAspect(value: ProviderAspect): NatalAspect {
  return {
    first: asText(value.p1, "Unknown"),
    second: asText(value.p2, "Unknown"),
    type: asText(value.type, "aspect"),
    orb: asFiniteNumber(value.orb),
    applying: value.is_applying === true,
  };
}

export function normaliseNatalResponse(payload: unknown): NatalCalculation {
  const source = payload as { planets?: unknown; angles_details?: { asc?: unknown }; houses?: unknown; aspects?: unknown; confidence?: unknown };
  if (!Array.isArray(source.planets)) throw new Error("The natal provider returned no planetary positions.");
  const planets = source.planets.filter((item): item is ProviderPoint => Boolean(item) && typeof item === "object");
  const sun = findPoint(planets, "Sun");
  const moon = findPoint(planets, "Moon");
  const rising = toPlacement((source.angles_details?.asc ?? {}) as ProviderPoint, "Ascendant");
  const aspects = Array.isArray(source.aspects)
    ? source.aspects.filter((item): item is ProviderAspect => Boolean(item) && typeof item === "object").filter(aspect => aspect.is_major === true).map(toAspect).slice(0, 8)
    : [];
  const calculatedAt = new Date().toISOString();
  const sunFocus = signFocus[sun.sign] ?? "self-directed approach";
  const moonFocus = signFocus[moon.sign] ?? "inner response pattern";
  const risingFocus = signFocus[rising.sign] ?? "outer style";
  const elementBalance = planets.reduce<Record<string, number>>((balance, point) => {
    const element = signElements[signCodes[asText(point.sign, "")] ?? asText(point.sign, "")] ?? "Air";
    balance[element] = (balance[element] ?? 0) + 1;
    return balance;
  }, {});
  const leadingElement = Object.entries(elementBalance).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "Air";
  const houseBalance = planets.map(point => toPlacement(point, "Planet")).filter(point => point.house !== null).reduce<Record<string, number>>((balance, point) => {
    const house = String(point.house);
    balance[house] = (balance[house] ?? 0) + 1;
    return balance;
  }, {});
  const focusHouse = Object.entries(houseBalance).sort(([, a], [, b]) => b - a)[0]?.[0] ?? null;

  return {
    provider: PROVIDER,
    providerVersion: VERSION,
    calculatedAt,
    chartData: {
      sun,
      moon,
      rising,
      planets: planets.map(point => toPlacement(point, "Planet")),
      houses: Array.isArray(source.houses) ? source.houses : [],
      aspects,
    },
    readingData: {
      title: `Your ${sun.sign} Sun, ${moon.sign} Moon & ${rising.sign} Rising`,
      introduction: "This is a reflective reading of calculated natal placements, not a prediction or clinical assessment.",
      sections: [
        { label: "Core direction", placement: sun.formatted, interpretation: `Your Sun in ${sun.sign} points to a ${sunFocus}. Use it as the part of the chart that describes what feels most like a conscious direction of growth.` },
        { label: "Inner weather", placement: moon.formatted, interpretation: `Your Moon in ${moon.sign} describes a ${moonFocus}. Notice it when you need to understand what restores your equilibrium.` },
        { label: "First impression", placement: rising.formatted, interpretation: `Your Rising sign is ${rising.sign}, suggesting a ${risingFocus} when you meet a new setting or threshold.` },
        { label: "Element balance", placement: `${leadingElement} emphasis`, interpretation: `Your calculated placements lean toward ${leadingElement.toLowerCase()} themes. Let this be a practical lens for where you may seek movement, grounding, connection, or restoration.` },
        ...(focusHouse ? [{ label: "House focus", placement: `House ${focusHouse} emphasis`, interpretation: `Several calculated placements gather in your ${focusHouse}${focusHouse === "1" ? "st" : focusHouse === "2" ? "nd" : focusHouse === "3" ? "rd" : "th"} house. Treat this as an area of life that may reward ongoing attention and conscious choice.` }] : []),
        ...aspects.slice(0, 3).map(aspect => ({ label: "Key aspect", placement: `${aspect.first} ${aspect.type} ${aspect.second}`, interpretation: `This calculated aspect is an invitation to notice how these parts of your chart cooperate or ask for conscious integration.` })),
      ],
      practicalFocus: `For one week, notice where your ${sun.sign} Sun leads, your ${moon.sign} Moon needs care, and your ${rising.sign} Rising shapes your first move.`,
    },
    sourceData: {
      provider: PROVIDER,
      providerVersion: VERSION,
      endpoint: FREE_ASTRO_NATAL_ENDPOINT,
      calculationMethod: "Western natal calculation supplied by FreeAstroAPI",
      calculatedAt,
      confidence: source.confidence && typeof source.confidence === "object" ? source.confidence : null,
    },
  };
}

export async function calculateNatalChart(profile: CosmicProfile): Promise<NatalCalculation> {
  const key = process.env.FREEASTRO_API_KEY;
  if (!key) throw new Error("The astrology calculation service is not configured.");
  if (!profile.birthTime) throw new Error("Add your birth time to calculate an accurate Rising sign and house chart.");
  const [year, month, day] = profile.birthDate.split("-").map(Number);
  const [hour, minute] = profile.birthTime.split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) throw new Error("Your saved birth details need a valid date and time before calculation.");

  const response = await fetch(FREE_ASTRO_NATAL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": key },
    body: JSON.stringify({ year, month, day, hour, minute, city: profile.birthLocation }),
  });
  if (!response.ok) throw new Error(`The astrology calculation service could not complete your chart (${response.status}).`);
  return normaliseNatalResponse(await response.json());
}
