import { writeFile } from "node:fs/promises";

const baseUrl = process.env.COSMIC_URL ?? "https://3000-it178zywxc3e97z4gz575-5c0b030f.sg1.manus.computer";
const cdpUrl = process.env.CDP_URL ?? "http://127.0.0.1:9222";

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const targets = await (await fetch(`${cdpUrl}/json/list`)).json();
const page = targets.find(target => target.type === "page");
if (!page?.webSocketDebuggerUrl) throw new Error("No Chromium page target found");

const socket = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let messageId = 0;
const pending = new Map();
socket.addEventListener("message", event => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    message.error ? reject(new Error(message.error.message)) : resolve(message.result);
  }
});

const send = (method, params = {}) => new Promise((resolve, reject) => {
  const id = ++messageId;
  pending.set(id, { resolve, reject });
  socket.send(JSON.stringify({ id, method, params }));
});

const evaluate = async expression => {
  const { result } = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true });
  if (result.subtype === "error") throw new Error(result.description);
  return result.value;
};

const tap = async selectorOrText => {
  const activation = await evaluate(`(() => {
    const candidates = ${selectorOrText.startsWith("[")
      ? `[...document.querySelectorAll('a,button,input')].filter(element => element.textContent?.trim() === ${JSON.stringify(selectorOrText.slice(1, -1))})`
      : `[document.querySelector(${JSON.stringify(selectorOrText)})].filter(Boolean)`};
    const candidate = candidates.find(element => {
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (!candidate) return { activated: false, innerWidth: window.innerWidth };
    candidate.click();
    return { activated: true, innerWidth: window.innerWidth };
  })()`);
  if (!activation?.activated) throw new Error(`Could not activate ${selectorOrText} at mobile width ${activation?.innerWidth ?? "unknown"}`);
  await delay(500);
};

const navigate = async path => {
  await send("Page.navigate", { url: `${baseUrl}${path}` });
  await delay(900);
};

await send("Page.enable");
await send("Runtime.enable");
if (process.env.COSMIC_EMULATE !== "false") {
  await send("Emulation.setDeviceMetricsOverride", { width: 375, height: 812, deviceScaleFactor: 1, mobile: true });
  await send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
  await send("Network.setUserAgentOverride", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1" });
}

const results = { requestedViewport: { width: 375, height: 812 }, emulated: process.env.COSMIC_EMULATE !== "false", routes: [] };

await navigate("/");
results.measuredViewport = await evaluate("({ width: window.innerWidth, height: window.innerHeight })");
await tap('button[aria-label="Open menu"]');
await tap("[TAROT]");
results.routes.push({ route: await evaluate("location.pathname"), firstUse: await evaluate("document.body.innerText.includes('DRAW A CARD')") });
await tap("[DRAW A CARD]");
results.tarotDrawActivated = await evaluate("['The Hermit', 'The Star', 'The Fool', 'The High Priestess', 'The Sun', 'The Moon'].some(name => document.body.innerText.includes(name))");

await navigate("/");
await tap('button[aria-label="Open menu"]');
await tap("[PALMISTRY]");
results.routes.push({ route: await evaluate("location.pathname"), firstUse: await evaluate("document.body.innerText.includes('START CAMERA GUIDE')") });
await evaluate("Object.defineProperty(navigator, 'mediaDevices', { value: undefined, configurable: true })");
await tap('input[type="checkbox"]');
await tap("[START CAMERA GUIDE]");
results.palmFallbackActivated = await evaluate("document.body.innerText.includes('Camera guidance is unavailable in this browser.')");

await writeFile("/home/ubuntu/cosmic-platform/scripts/mobile-navigation-verification.json", `${JSON.stringify(results, null, 2)}\n`);
socket.close();
console.log(JSON.stringify(results));
