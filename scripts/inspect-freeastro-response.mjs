const response = await fetch("https://api.freeastroapi.com/api/v1/natal/calculate", {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-api-key": process.env.FREEASTRO_API_KEY ?? "" },
  body: JSON.stringify({ year: 1990, month: 5, day: 15, hour: 14, minute: 30, city: "New York" }),
});

if (!response.ok) throw new Error(`FreeAstroAPI shape probe failed with ${response.status}`);
const payload = await response.json();
const keys = Object.keys(payload).sort();
const nested = Object.fromEntries(
  keys.map(key => [key, payload[key] && typeof payload[key] === "object" && !Array.isArray(payload[key]) ? Object.keys(payload[key]).sort() : Array.isArray(payload[key]) ? `array:${payload[key].length}` : typeof payload[key]]),
);
const objectKeys = value => value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value).sort() : typeof value;
console.log(JSON.stringify({
  keys,
  nested,
  samplePlanetFields: objectKeys(payload.planets?.[0]),
  sampleHouseFields: objectKeys(payload.houses?.[0]),
  sampleAspectFields: objectKeys(payload.aspects?.[0]),
  angleDetailFields: objectKeys(payload.angles_details?.asc),
}, null, 2));
