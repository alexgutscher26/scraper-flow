Politeness Features

Overview

- Robots.txt awareness with configurable enforcement.
- Randomized delays with jitter to mimic natural browsing.
- User-agent rotation and HTTP header randomization.

Configuration

- Env vars (defaults):
  - `POLITENESS_ROBOTS_ENABLED` (true|false)
  - `POLITENESS_ROBOTS_ENFORCEMENT` (strict|lenient)
  - `POLITENESS_ROBOTS_UA_OVERRIDE` (string)
  - `POLITENESS_DELAYS_ENABLED` (true|false)
  - `POLITENESS_DELAY_MIN_MS` (number)
  - `POLITENESS_DELAY_MAX_MS` (number)
  - `POLITENESS_DELAY_JITTER_PCT` (0–1)
  - `POLITENESS_DELAY_STRATEGY` (uniform|normal)
  - `POLITENESS_UA_ENABLED` (true|false)
  - `POLITENESS_UA_ROTATE_STRATEGY` (perNavigation|perDomain|perSession)
  - `POLITENESS_ACCEPT_LANGUAGE_RANDOMIZE` (true|false)

- Per-workflow override (stored in `workflow.definition`):

```
{
  "settings": {
    "politeness": {
      "robots": { "enabled": true, "enforcement": "strict" },
      "delays": { "enabled": true, "minMs": 500, "maxMs": 1500, "jitterPct": 0.15, "strategy": "uniform" },
      "userAgent": {
        "enabled": true,
        "rotateStrategy": "perNavigation",
        "pool": ["Mozilla/5.0 ..."],
        "headers": { "x-custom": "value" },
        "acceptLanguageRandomization": true
      }
    }
  }
}
```

Behavior

- Robots.txt: Blocks disallowed navigations when `enforcement=strict`; logs warnings when `lenient`.
- Delays: Applied before network-affecting tasks (launch, navigate, click). Computed within bounds with jitter.
- UA & headers: Applied before navigation; rotates per configured strategy; randomizes `accept-language`.

Best Practices

- Keep delays modest to avoid performance degradation while reducing detection.
- Use `perDomain` rotation for sites sensitive to UA changes mid-session.
- Prefer `strict` robots enforcement for compliance.

Troubleshooting

- If many requests are blocked, review phase logs for robots decisions and reduce crawl intensity.
- If performance dips, disable delays or narrow affected tasks.
