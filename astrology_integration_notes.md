# Natal Calculation Source Notes

## Selected Provider: FreeAstroAPI

FreeAstroAPI is selected for Cosmic’s first genuine natal-chart layer because its official documentation exposes a Western natal-calculation endpoint, a server-side `x-api-key` authentication model, and further natal insights and SVG chart endpoints suitable for later expansion.

| Item | Confirmed contract |
|---|---|
| Base URL | `https://api.freeastroapi.com` |
| Initial endpoint | `POST /api/v1/natal/calculate` |
| Authentication | `x-api-key: <FREEASTRO_API_KEY>` over HTTPS |
| Minimum documented payload | `year`, `month`, `day`, `hour`, `minute`, and `city` |
| Relevant expansion endpoints | Natal insights, visual SVG charts, transits, daily personal, and branded reports |

The key is configured server-side as `FREEASTRO_API_KEY`; a live Vitest credential check passed on 2026-08-20. Calculations must be initiated from an authenticated member flow with clear consent before their private birth data is sent to the provider.

## Official Sources

1. [FreeAstroAPI documentation](https://www.freeastroapi.com/docs)
2. [FreeAstroAPI public OpenAPI specification repository](https://github.com/FreeAstroApi/freeastro-api-spec)
3. [AstrologyAPI natal chart overview](https://astrologyapi.com/western-astrology/natal-chart-api) — comparison source describing natal positions, houses, and aspects.
4. [Astrologer API repository](https://github.com/g-battaglia/Astrologer-API) — comparison source documenting a RapidAPI/Swiss Ephemeris alternative.
