export type DailyQuote = {
  key: string;
  text: string;
  theme: string;
};

const QUOTES: Omit<DailyQuote, "key">[] = [
  { text: "Let the next small truth be enough to guide the next small step.", theme: "Attention / next movement" },
  { text: "A pattern becomes useful when it gives you permission to choose differently.", theme: "Pattern / agency" },
  { text: "Clarity does not have to arrive loudly to change the shape of a day.", theme: "Clarity / gentle change" },
  { text: "Leave room for the answer that arrives after you stop forcing the question.", theme: "Inquiry / patience" },
  { text: "Your inner weather can be noticed without becoming your forecast.", theme: "Awareness / perspective" },
  { text: "A ritual is simply a way of returning to what you already know matters.", theme: "Ritual / return" },
  { text: "Make one choice today that lets your future self exhale.", theme: "Intention / care" },
  { text: "The most honest direction is often the one that asks less performance from you.", theme: "Direction / honesty" },
];

export function localDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dayIndex(dayKey: string) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000) % QUOTES.length;
}

export function getDailyQuote(date = new Date()): DailyQuote {
  const key = localDayKey(date);
  return { key, ...QUOTES[dayIndex(key)] };
}
