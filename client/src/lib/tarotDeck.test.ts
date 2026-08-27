import { describe, expect, it } from "vitest";
import { createTarotSpread, createTarotSynthesis, drawNextTarotCard, tarotDeck, shuffleTarotDeck } from "./tarotDeck";

describe("tarot deck", () => {
  it("contains the complete 78-card major and minor arcana without duplicate identities", () => {
    expect(tarotDeck).toHaveLength(78);
    expect(new Set(tarotDeck.map(card => card.id)).size).toBe(78);
    expect(tarotDeck.some(card => card.name === "The Fool")).toBe(true);
    expect(tarotDeck.some(card => card.name === "King of Pentacles")).toBe(true);
  });

  it("uses a non-mutating Fisher–Yates permutation", () => {
    const original = tarotDeck.map(card => card.id);
    const shuffled = shuffleTarotDeck(tarotDeck, () => 0);
    expect(shuffled.map(card => card.id)).not.toEqual(original);
    expect(new Set(shuffled.map(card => card.id))).toEqual(new Set(original));
    expect(tarotDeck.map(card => card.id)).toEqual(original);
  });

  it("deals three unique cards, limits the spread, and resets with a new pile", () => {
    const pile = shuffleTarotDeck(tarotDeck, max => max - 1);
    const start = createTarotSpread(() => pile);
    const first = drawNextTarotCard(start, "upright");
    const second = drawNextTarotCard(first, "reversed");
    const third = drawNextTarotCard(second, "upright");
    expect(third.drawnCards).toHaveLength(3);
    expect(new Set(third.drawnCards.map(card => card.id)).size).toBe(3);
    expect(drawNextTarotCard(third, "upright")).toEqual(third);
    expect(createTarotSpread(() => pile)).toMatchObject({ drawnCards: [], drawPile: pile });
  });

  it("creates a position-aware reflective synthesis only after three cards", () => {
    const spread = [
      { ...tarotDeck[0], orientation: "upright" as const },
      { ...tarotDeck[1], orientation: "reversed" as const },
      { ...tarotDeck[2], orientation: "upright" as const },
    ];
    expect(createTarotSynthesis([])).toContain("Draw three cards");
    const synthesis = createTarotSynthesis(spread);
    expect(synthesis).toContain("The Fool (upright)");
    expect(synthesis).toContain("The Magician (reversed)");
    expect(synthesis).toContain("reflective prompt, not a forecast");
  });
});
