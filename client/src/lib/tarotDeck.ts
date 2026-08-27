export type TarotCard = {
  id: string;
  name: string;
  arcana: string;
  axis: string;
  note: string;
};

export type DrawnTarotCard = TarotCard & {
  orientation: "upright" | "reversed";
};

const majorArcana: Array<Omit<TarotCard, "id" | "arcana">> = [
  { name: "The Fool", axis: "Open beginning", note: "Meet the unknown with attention rather than certainty, and take one well-considered first step." },
  { name: "The Magician", axis: "Focused agency", note: "Notice the tools already within reach and choose one clear way to direct your energy." },
  { name: "The High Priestess", axis: "Quiet knowing", note: "Let observation and private reflection have a little more room before you decide." },
  { name: "The Empress", axis: "Nurturing growth", note: "Consider what becomes more alive when you give it care, time, and practical attention." },
  { name: "The Emperor", axis: "Useful structure", note: "Create a boundary or plan sturdy enough to support what matters without becoming rigid." },
  { name: "The Hierophant", axis: "Shared wisdom", note: "Look to a trusted practice, teacher, or tradition, then decide what is genuinely yours to keep." },
  { name: "The Lovers", axis: "Values in relationship", note: "Bring a choice back to the values and agreements that make connection feel honest." },
  { name: "The Chariot", axis: "Directed momentum", note: "Choose a direction and hold it with calm discipline instead of scattering your effort." },
  { name: "Strength", axis: "Steady courage", note: "Use patience and compassion to meet a strong feeling rather than trying to overpower it." },
  { name: "The Hermit", axis: "Inner authority", note: "Step back from noise long enough to distinguish your own signal from a borrowed urgency." },
  { name: "Wheel of Fortune", axis: "Turning point", note: "Notice what is changing and identify the response that is still available to you." },
  { name: "Justice", axis: "Clear accountability", note: "Name what is fair, factual, and proportionate before deciding what comes next." },
  { name: "The Hanged One", axis: "Changed perspective", note: "Pause long enough to see the situation from an angle that action alone cannot reveal." },
  { name: "Death", axis: "Necessary release", note: "Allow an outdated expectation or pattern to complete so that another approach can begin." },
  { name: "Temperance", axis: "Deliberate balance", note: "Experiment with a measured blend of opposing needs rather than choosing an extreme." },
  { name: "The Devil", axis: "Pattern awareness", note: "Identify where habit, fear, or attachment has narrowed your choices, then reclaim one degree of agency." },
  { name: "The Tower", axis: "Honest disruption", note: "Let a false certainty be revised; clarity can arrive when the old story no longer holds." },
  { name: "The Star", axis: "Reorientation", note: "Move toward what repairs your energy system; hope becomes useful when it is attached to a repeatable action." },
  { name: "The Moon", axis: "Uncertain terrain", note: "Work with what you know while leaving space for what has not become clear yet." },
  { name: "The Sun", axis: "Visible vitality", note: "Let clarity, warmth, and directness illuminate the part of the situation that is ready to be shared." },
  { name: "Judgement", axis: "Honest review", note: "Reflect on what you have learned and answer the invitation to act with greater awareness." },
  { name: "The World", axis: "Integrated completion", note: "Recognize what has come full circle and consider how to carry the learning forward." },
];

const minorRanks = [
  ["Ace", "Seed potential"], ["Two", "Balancing choice"], ["Three", "Early expression"], ["Four", "Stability and pause"],
  ["Five", "Constructive tension"], ["Six", "Adjustment and exchange"], ["Seven", "Discernment"], ["Eight", "Practice and movement"],
  ["Nine", "Near completion"], ["Ten", "Full expression"], ["Page", "Curious beginning"], ["Knight", "Active pursuit"],
  ["Queen", "Embodied wisdom"], ["King", "Mature direction"],
] as const;

const suits = [
  { name: "Wands", focus: "creative drive", prompt: "Consider how to direct initiative, courage, and the energy behind your next move." },
  { name: "Cups", focus: "emotional connection", prompt: "Consider what helps feeling, relationship, and care move with greater honesty." },
  { name: "Swords", focus: "thought and communication", prompt: "Consider the thought, conversation, or decision that benefits from greater precision." },
  { name: "Pentacles", focus: "material practice", prompt: "Consider the grounded resource, routine, or commitment that can support your intention." },
] as const;

export const tarotDeck: TarotCard[] = [
  ...majorArcana.map((card, index) => ({ ...card, id: `major-${index}`, arcana: `${index === 0 ? "0" : String(index).padStart(2, "0")} / Major Arcana` })),
  ...suits.flatMap(suit => minorRanks.map(([rank, axis]) => ({
    id: `minor-${rank.toLowerCase()}-${suit.name.toLowerCase()}`,
    name: `${rank} of ${suit.name}`,
    arcana: `${rank} / Minor Arcana`,
    axis: `${axis} · ${suit.focus}`,
    note: suit.prompt,
  }))),
];

function secureRandomIndex(maxExclusive: number): number {
  if (maxExclusive <= 1) return 0;
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const range = 0x1_0000_0000;
    const limit = range - (range % maxExclusive);
    const value = new Uint32Array(1);
    do globalThis.crypto.getRandomValues(value); while (value[0] >= limit);
    return value[0] % maxExclusive;
  }
  return Math.floor(Math.random() * maxExclusive);
}

/** Returns a new Fisher–Yates permutation without mutating the canonical deck. */
export function shuffleTarotDeck(cards: readonly TarotCard[] = tarotDeck, nextIndex = secureRandomIndex): TarotCard[] {
  const shuffled = [...cards];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const replacementIndex = nextIndex(index + 1);
    [shuffled[index], shuffled[replacementIndex]] = [shuffled[replacementIndex], shuffled[index]];
  }
  return shuffled;
}

export function drawOrientation(nextIndex = secureRandomIndex): DrawnTarotCard["orientation"] {
  return nextIndex(2) === 0 ? "upright" : "reversed";
}

export type TarotSpreadState = { drawPile: TarotCard[]; drawnCards: DrawnTarotCard[] };

export function createTarotSpread(shuffler = shuffleTarotDeck): TarotSpreadState {
  return { drawPile: shuffler(tarotDeck), drawnCards: [] };
}

export function drawNextTarotCard(state: TarotSpreadState, orientation = drawOrientation()): TarotSpreadState {
  if (state.drawnCards.length >= 3 || state.drawPile.length === 0) return state;
  const [card, ...drawPile] = state.drawPile;
  return { drawPile, drawnCards: [...state.drawnCards, { ...card, orientation }] };
}

const positionNames = ["Context", "Threshold", "Orientation"] as const;

export function createTarotSynthesis(cards: DrawnTarotCard[]): string {
  if (cards.length !== 3) return "Draw three cards to explore Context, Threshold, and Orientation. Every spread comes from a newly shuffled 78-card deck; cards do not repeat within this spread.";
  const [context, threshold, orientation] = cards;
  const describe = (card: DrawnTarotCard) => `${card.name} (${card.orientation})`;
  return `${describe(context)} names the ${positionNames[0].toLowerCase()}: ${context.note} ${describe(threshold)} brings the ${positionNames[1].toLowerCase()} into focus: ${threshold.note} ${describe(orientation)} offers an ${positionNames[2].toLowerCase().toLowerCase()} for your next considered step: ${orientation.note} Treat the pattern as a reflective prompt, not a forecast.`;
}
