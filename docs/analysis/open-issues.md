# Offene Punkte / Beobachtungen

Stand: 2026-04-12
Commit: 67fb9ab4

Liste von Auffälligkeiten aus der ersten Durchsicht. Keine Bugs, die User melden, sondern Dinge, die einem neuen Entwickler (oder Claude in einer späteren Session) sofort Kontext geben sollen. Einträge bei Erledigung in Abschnitt `## Erledigt` verschieben (mit Commit-Hash).

## Code-Stil & Legacy

- **Typo im Globals-Key:** `window.__initalState__` (fehlendes „i") ist auf Server- **und** Client-Seite hart verdrahtet. Rename erfordert koordinierte Änderung in [src/server/page-renderer.js](../../src/server/page-renderer.js) und [src/bootstrap/client-bootstrapper.js](../../src/bootstrap/client-bootstrapper.js). Bis dahin: nicht anfassen.
- **`boolStringSchema`** akzeptiert `true`/`false` als Boolean *oder* String – vermutlich Legacy-Kompat für alte Clients. Beim Neu-Schreiben von Endpunkten nicht übernehmen.
- **Auskommentierter Code** in [src/server/media-library-controller.js](../../src/server/media-library-controller.js) Z. 56–63 deutet auf unvollständigen Refactor.

## Validierungs-Lücken

- Mehrere Schemata in [src/domain/schemas/](../../src/domain/schemas/) (u. a. `document-schemas.js`) verwenden `joi.any().allow(null)` statt konkreter Typen.
- `smtpOptions` im `ServerConfig`-Joi-Schema: `joi.any()` – keine Strukturvalidierung.
- MIME-Type-Prüfung bei Uploads basiert rein auf Dateiendung (`mime.getType(originalname)`), kein Content-Sniffing.

## Test-Abdeckung

- 98 Spec-Dateien auf 846 Source-Dateien (~11,6 %). Größere Lücken:
  - [src/domain/multipart-middleware.js](../../src/domain/multipart-middleware.js)
  - [src/domain/rate-limit-middleware.js](../../src/domain/rate-limit-middleware.js)
  - [src/server/page-renderer.js](../../src/server/page-renderer.js)
  - [src/bootstrap/client-bootstrapper.js](../../src/bootstrap/client-bootstrapper.js)
  - Session-Ablauf/Erneuerung
  - `LoadSamlMetadataJob` (Metadaten-Refresh zur Laufzeit)
  - Container-Disposal-Reihenfolge
- Keine `.skip` / `.only` / `xit` in den Specs gefunden.

## Versionen & Pinning

- `engines.node`: `^20.0.0` – lose; lokaler Rechner läuft auf Node 22. Keine `.nvmrc` → potenzielle Drift zwischen Dev-Maschinen und CI.
- Ant Design: exakt auf `5.21.2` gepinnt, Icons auf `5.5.1`. Blockiert ggf. Sicherheitsupdates.
- React / React-DOM: `~18.2.0` (Patch-Updates ok).
- `passport-saml`: `^4.0.4`.

## Sicherheit (Dinge, die ein Integrator prüfen sollte)

- **Kein CSRF-Token** – Schutz hängt an Session-Cookies + SameSite. Für eingebettete Iframes / Cross-Origin-Setups explizit bewerten.
- **Session-Fallback-Secret** wird zufällig generiert, wenn nicht konfiguriert. In Produktion muss das Secret zwingend gesetzt sein (sonst invalidieren Neustarts alle Sessions).
- **Markdown-Sanitizing** (`GithubFlavoredMarkdown`-Service) wurde nicht im Detail geprüft – relevant, wenn Nutzer-Input in Markdown-Sections gerendert wird.

## Dokumentations-Lücken

- Keine Route-Übersicht pro Controller (nur grobe Beschreibung in `CLAUDE.md`).
- Kein offizielles Beispiel-Plugin im Repo – Custom-Plugin-Autoren müssen sich an `markdown`/`image` orientieren.
- Job-Scheduler-API wird nur aus dem Code ableitbar.
- `PageComponent.clientPreloader`-Pattern ist optional, aber kaum dokumentiert.

## Logging / Dev-Output

- [src/common/logger.js](../../src/common/logger.js) nutzt im Browser `console.log()` ungefiltert.
- [src/components/pages/tests.js](../../src/components/pages/tests.js) hat un-gated `console.error()` – sollte Test-Only sein.

## Erledigt

_(leer – hier landen Einträge mit Commit-Hash, wenn sie behoben wurden)_
