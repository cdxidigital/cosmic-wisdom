export const ZODIAC_SIGNS = [
  "Capricorn",
  "Aquarius",
  "Pisces",
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
] as const;

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

type LensInput = {
  memberSunSign: ZodiacSign;
  companionSunSign: ZodiacSign;
};

export type CompatibilityLens = {
  title: string;
  introduction: string;
  cards: Array<{ label: string; copy: string }>;
  limitation: string;
  question: string;
};

const signBoundaries: Array<[number, number, ZodiacSign]> = [
  [1, 20, "Aquarius"],
  [2, 19, "Pisces"],
  [3, 21, "Aries"],
  [4, 20, "Taurus"],
  [5, 21, "Gemini"],
  [6, 21, "Cancer"],
  [7, 23, "Leo"],
  [8, 23, "Virgo"],
  [9, 23, "Libra"],
  [10, 23, "Scorpio"],
  [11, 22, "Sagittarius"],
  [12, 22, "Capricorn"],
];

export function signFromBirthDate(value: string): ZodiacSign | null {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day || month < 1 || month > 12 || day < 1 || day > 31) return null;

  return signBoundaries.reduce<ZodiacSign>((currentSign, [boundaryMonth, boundaryDay, sign]) => {
    return month > boundaryMonth || (month === boundaryMonth && day >= boundaryDay) ? sign : currentSign;
  }, "Capricorn");
}

export function buildDateCompatibilityLens({ memberSunSign, companionSunSign }: LensInput): CompatibilityLens {
  const isAquariusGemini = memberSunSign === "Aquarius" && companionSunSign === "Gemini";

  if (isAquariusGemini) {
    return {
      title: "Ideas meet air: Aquarius + Gemini",
      introduction:
        "This date-based lens highlights the shared air-sign tone of an Aquarius Sun and Gemini Sun: curiosity, independence, conversation, and a preference for keeping possibility alive.",
      cards: [
        {
          label: "Communication",
          copy:
            "Conversation can be the connective tissue here. Name the point beneath the tangent, then let each person think aloud without treating a different pace as disinterest.",
        },
        {
          label: "Emotional rhythm",
          copy:
            "A shared preference for movement and ideas can make things feel light and open. When either person is overloaded, a short, direct check-in can be kinder than assuming distance means detachment.",
        },
        {
          label: "Care & freedom",
          copy:
            "Care may land best through respect for individuality: exchanging discoveries, backing a new direction, and agreeing on when connection needs to be active rather than merely assumed.",
        },
        {
          label: "Friction as information",
          copy:
            "The same mental agility that keeps things interesting can dodge a simple feeling or practical commitment. If tension appears, trade interpretation for one concrete request and one honest answer.",
        },
      ],
      limitation:
        "This is a Sun-sign, birth-date lens only. It does not calculate the other person’s Moon, Rising sign, houses, aspects, or a full synastry comparison because their birth time is unknown.",
      question: "When the conversation moves quickly, what helps each of us feel heard rather than merely informed?",
    };
  }

  return {
    title: `${memberSunSign} + ${companionSunSign}: a place to begin`,
    introduction:
      "This date-based lens uses the two Sun-sign archetypes as a prompt for noticing how each person approaches expression, attention, and autonomy. It is not a relationship score or prediction.",
    cards: [
      { label: "Communication", copy: "Say what you mean, then make space for the other person’s pace and context." },
      { label: "Emotional rhythm", copy: "Ask what helps each person reset after intensity. Different soothing styles are information, not a failure." },
      { label: "Care & freedom", copy: "Name what care looks like rather than assuming either person should recognise it without being told." },
      { label: "Friction as information", copy: "When tension appears, get curious about urgency, boundaries, and unspoken agreements before treating it as proof of incompatibility." },
    ],
    limitation:
      "This is a Sun-sign, birth-date lens only. It does not calculate the other person’s Moon, Rising sign, houses, aspects, or a full synastry comparison because their birth time is unknown.",
    question: "What would make this connection feel more spacious and honest for both of us?",
  };
}
