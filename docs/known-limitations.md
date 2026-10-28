# Known limitations

This app was largely vibe-coded with AI assistance. It is experimental, unofficial and unsupported. Tests and manual observations improve confidence but do not establish complete correctness, security, or parity with the game. Use it at your own risk. No maintenance, response, bug-fix or compatibility commitment is made; see [SUPPORT.md](../SUPPORT.md) and [LICENSE](../LICENSE).

## Game rules and data

- The catalog and native recipes target build 26090957. A later game patch requires another audit; changing an executable hash alone is not a migration.
- Footprints are game-derived, but fixed orientations are an explicit planning assumption. Full runtime replacement/merge behavior and every catalog entry have not been certified in-game.
- Known selected-class ordinary-perk grants obey the selected rank. Other-class and unknown/shared unlock paths are assumed available. There is no account-wide ownership tracker, and some acquisition/catalog membership remains unresolved.
- Modifier matching and single-group membership follow the audited translation. An explicit Attach to choice requires that exact host; it is not a soft preference.
- Optimal fit proves the priority inclusion vector within the implemented model. It does not certify that the game will accept a layout or that the build is strong in combat. A search limit provides a valid best-found result only when one was found.
- Descriptions are sourced text. The app does not calculate combined damage, stacking, uptime, caps or combat effectiveness. Conditions remain conditions.

## Browser use and saves

The app uses modern JavaScript, BigInt and a module Web Worker. Chromium/Edge is covered by the automated browser suite; other browser/device combinations are not fully certified. Clipboard access depends on browser permissions and a suitable origin; manual JSON and file controls are available.

Drafts and named snapshots belong to the browser profile and origin. Clearing storage, changing browsers, or moving between localhost and GitHub Pages can make saves unavailable. Export important builds and import them at the new origin. Hosted deployment does not migrate local saves. The app has no accounts, cloud synchronization, telemetry code, or server-side build storage.

Unknown saved IDs are retained as missing entries, and malformed/future saves are preserved rather than overwritten. This defensive behavior is not a data-recovery guarantee. The 60-second budget and cancellation keep search bounded but cannot guarantee an optimum for arbitrary input or device performance.

## Project boundaries

The browser app does not modify the game or read installed files. Research scripts are separate local tools; raw assets, tools, executable files and archive keys stay out of the public repository and Pages output. Game-derived material and third-party dependencies have separate rights and notices in [NOTICE.md](../NOTICE.md).
