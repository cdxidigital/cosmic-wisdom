type UnknownRecord = Record<string, unknown>;

export type NatalPatternDimension = { label: string; title: string; interpretation: string };
export type DailyNatalTeaching = { date: string; title: string; pattern: string; practice: string; question: string; note: string };
export type NatalPatternReading = {
  headline: string;
  overview: string;
  dimensions: NatalPatternDimension[];
  teaching: DailyNatalTeaching;
};

const elementBySign: Record<string, string> = {
  Aries: "Fire", Leo: "Fire", Sagittarius: "Fire", Taurus: "Earth", Virgo: "Earth", Capricorn: "Earth",
  Gemini: "Air", Libra: "Air", Aquarius: "Air", Cancer: "Water", Scorpio: "Water", Pisces: "Water",
};

const elementTeaching: Record<string, { strength: string; practice: string }> = {
  Fire: { strength: "initiative, courage, and clear movement", practice: "Choose one action that turns a thought into a modest, visible beginning." },
  Earth: { strength: "stewardship, consistency, and embodied follow-through", practice: "Tend one practical foundation: your time, body, space, or resources." },
  Air: { strength: "perspective, language, and connection", practice: "Put one important thought into plain language, then listen for what it changes." },
  Water: { strength: "feeling, memory, and relational sensitivity", practice: "Name one feeling without solving it, and let that honesty guide a kinder response." },
};

const houseFocus: Record<number, string> = {
  1: "identity and how you meet new thresholds", 2: "values, resources, and self-trust", 3: "learning, conversation, and your immediate environment",
  4: "home, belonging, and private foundations", 5: "creative expression, pleasure, and play", 6: "practice, service, and daily maintenance",
  7: "partnership, agreement, and reciprocity", 8: "shared resources, trust, and transformation", 9: "meaning, study, and wider horizons",
  10: "vocation, contribution, and visible responsibility", 11: "community, friendship, and future-minded ideals", 12: "rest, inner processing, and renewal",
};

function record(value: unknown): UnknownRecord | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : null;
}

function placements(chartData: unknown) {
  const source = record(chartData);
  const values = Array.isArray(source?.planets) ? source?.planets : [];
  return values.map(record).filter((value): value is UnknownRecord => Boolean(value));
}

function placement(chartData: unknown, key: string) {
  return record(record(chartData)?.[key]);
}

function text(value: unknown, fallback = "Unknown") { return typeof value === "string" && value.trim() ? value.trim() : fallback; }
function number(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : null; }

function leadingElement(chartData: unknown) {
  const balance = placements(chartData).reduce<Record<string, number>>((result, point) => {
    const element = elementBySign[text(point.sign, "")] ?? "Air";
    result[element] = (result[element] ?? 0) + 1;
    return result;
  }, {});
  return Object.entries(balance).sort(([, first], [, second]) => second - first)[0]?.[0] ?? "Air";
}

function focusHouseNumber(chartData: unknown) {
  const balance = placements(chartData).reduce<Record<number, number>>((result, point) => {
    const house = number(point.house);
    if (house && house >= 1 && house <= 12) result[house] = (result[house] ?? 0) + 1;
    return result;
  }, {});
  return Number(Object.entries(balance).sort(([, first], [, second]) => second - first)[0]?.[0]) || null;
}

function hash(value: string) {
  return value.split("").reduce((total, character) => ((total * 31) + character.charCodeAt(0)) >>> 0, 7);
}

function cardinal(value: number) {
  const suffix = value % 10 === 1 && value !== 11 ? "st" : value % 10 === 2 && value !== 12 ? "nd" : value % 10 === 3 && value !== 13 ? "rd" : "th";
  return `${value}${suffix}`;
}

export function buildNatalPatternReading(chartData: unknown, date: string): NatalPatternReading | null {
  const sun = placement(chartData, "sun");
  const moon = placement(chartData, "moon");
  const rising = placement(chartData, "rising");
  if (!sun || !moon || !rising) return null;
  const sunSign = text(sun.sign);
  const moonSign = text(moon.sign);
  const risingSign = text(rising.sign);
  const element = leadingElement(chartData);
  const house = focusHouseNumber(chartData);
  const aspects = Array.isArray(record(chartData)?.aspects) ? record(chartData)?.aspects as UnknownRecord[] : [];
  const firstAspect = aspects.map(record).find(Boolean);
  const firstAspectLabel = firstAspect ? `${text(firstAspect.first)} ${text(firstAspect.type, "aspect")} ${text(firstAspect.second)}` : null;
  const elementLens = elementTeaching[element] ?? elementTeaching.Air;
  const lifeArea = house ? houseFocus[house] : "the balance between your inner needs and outer choices";
  const dailyModes = [
    { verb: "Notice", question: `Where is your ${sunSign} direction already asking for a cleaner expression?` },
    { verb: "Balance", question: `What would help your ${moonSign} inner rhythm feel included before you respond?` },
    { verb: "Offer", question: `How could your ${risingSign} way of meeting the world make today’s next step more relational?` },
  ];
  const mode = dailyModes[hash(`${date}:${sunSign}:${moonSign}:${risingSign}`) % dailyModes.length];
  const integration = firstAspectLabel
    ? `${firstAspectLabel} is treated here as an integration theme: hold both sides of the pattern in view before choosing a response.`
    : "Your chart works as a whole pattern; revisit the relationship between your core direction, inner rhythm, and outer style before choosing a response.";

  return {
    headline: `${sunSign} direction, ${moonSign} needs, ${risingSign} expression.`,
    overview: `Your natal pattern is not a verdict. It is a way to observe how a ${sunSign} core direction, a ${moonSign} inner rhythm, and a ${risingSign} outward approach can work together with greater choice.`,
    dimensions: [
      { label: "CORE AXIS", title: `${sunSign} Sun · ${moonSign} Moon · ${risingSign} Rising`, interpretation: "Begin with the tension and conversation between what consciously directs you, what restores you, and how you instinctively enter a room or situation." },
      { label: "ELEMENTAL RHYTHM", title: `${element} emphasis`, interpretation: `Your calculated chart leans toward ${element.toLowerCase()} qualities: ${elementLens.strength}. This is a strength to practice consciously, not a fixed identity.` },
      { label: "LIFE AREA", title: house ? `${cardinal(house)} house focus` : "Whole-pattern focus", interpretation: `Your chart invites sustained attention to ${lifeArea}. Notice the small choices that make this part of life more intentional.` },
      { label: "INTEGRATION", title: firstAspectLabel ?? "Key relationships between placements", interpretation: integration },
    ],
    teaching: {
      date,
      title: `${mode.verb} your ${element.toLowerCase()} pattern today.`,
      pattern: `Today’s teaching uses your saved ${sunSign} / ${moonSign} / ${risingSign} pattern and the calendar date. It is not a transit forecast or a prediction.`,
      practice: elementLens.practice,
      question: mode.question,
      note: "Generated privately on this page from your calculated natal chart. Nothing new is saved or sent when you return tomorrow.",
    },
  };
}
