# Architektur – Detailanalyse

Stand: 2026-04-12
Commit: 67fb9ab4

Ergänzt die Übersicht in [../../CLAUDE.md](../../CLAUDE.md) um Details, die aus der Kurzbeschreibung nicht hervorgehen.

## Dependency Injection (`src/common/di.js`)

Eigenbau, nur Singletons. Zwei Resolver-Typen:

- **`ServiceResolver`** – lazy Instanziierung per Klassen-Konstruktor. Abhängigkeiten werden über `static dependencies = [...]` deklariert und zur Resolve-Zeit aufgelöst.
- **`InstanceResolver`** – vorregistrierte Instanzen (z. B. `Database`, `Cdn`, `ServerConfig`), in [src/bootstrap/server-bootstrapper.js](../../src/bootstrap/server-bootstrapper.js) per `container.registerInstance()` eingehängt.

Weitere Eigenschaften:

- **Zirkuläre Abhängigkeiten** werden über Tracking der Resolve-Kette erkannt – erscheint eine Klasse zweimal in der Ahnenreihe, wirft der Container.
- **Unbekannte Keys** werden toleriert: Funktionen werden implizit zu `ServiceResolver`, Primitive zu `InstanceResolver` gewrappt.
- **Disposal** erfolgt in Gruppen (server → domain → storage) nach Prioritäten. Objekte mit `getDisposalInfo()`-Symbol werden beim Shutdown aufgeräumt.

## Controller-Registrierung (`src/server/controller-factory.js`)

Drei Phasen in fester Reihenfolge:

1. **`setupControllers`** – statische Assets, i18n, Settings.
2. **`pageAndApiControllers`** – eigentliche Anwendungs-Routen (Seiten + APIs).
3. **`finalMiddlewareControllers`** – Fehlerbehandlung, 404.

Jeder Controller deklariert `static dependencies` und wird einmal pro Container instanziiert. Custom-Controller aus `serverConfig.additionalControllers` werden zur Laufzeit über `ControllerFactory.registerAdditionalControllers()` nachgezogen.

## Job-Scheduler (`src/services/scheduling/job-scheduler.js`)

Drei Job-Typen:

- **`alwaysRunning`** – Polling. Job-Funktion gibt truthy zurück, solange noch Arbeit da ist; falsy → Scheduler wechselt zwischen `busyPollIntervalInMs` und `idlePollIntervalInMs`. Beispiele: `ProcessEventsJob`, `ProcessBatchesJob`.
- **`intervalBased`** – toad-scheduler, feste Intervalle.
- **`cron`** – croner, cron-Ausdrücke.

Das `preventOverrun`-Flag verhindert überlappende Ausführungen. Jobs leben unter [src/services/scheduling/jobs/](../../src/services/scheduling/jobs/) und erhalten den DI-Container injiziert.

## SSR + Client-Hydration

- Server rendert React per `ReactDOMServer.renderToString()` in [src/server/page-renderer.js](../../src/server/page-renderer.js). Ant-Design-Styles werden aus dem CSS-in-JS-Cache extrahiert und in das HTML eingebettet.
- Globale Daten (User, Settings, Theme, Resources, Licenses) werden per `htmlescape()` in `window.__*__`-Globals serialisiert – XSS-sicher.
- Client hydriert in [src/bootstrap/client-bootstrapper.js](../../src/bootstrap/client-bootstrapper.js) per `ReactDOMClient.hydrateRoot()`.
- **Preloader-Pattern:** Wenn `PageComponent.clientPreloader` existiert, wird es vor der Hydration instanziiert und `preload(initialState, request)` aufgerufen.
- **Kuriosität:** Der globale Key heißt `window.__initalState__` (fehlendes „i"). Typo ist auf Server- und Client-Seite hart verdrahtet – ein Rename muss koordiniert passieren.

## Request-Fluss

HTTP → Express-Middleware-Kette → Controller → Service → Store → MongoDB/S3.

Controller rufen `cloneDeep()` auf Request-Daten, bevor sie in React-Props fließen, um Mutationen zu isolieren.

## Migrationen

Über [umzug](https://github.com/sequelize/umzug) verwaltet. Aktive Migrationen in [migrations/](../../migrations/), archivierte in [migrations/archived/](../../migrations/archived/). Stand 2026-04 zeigen aktuelle Migrationen (`mediaTrashItems`, Image-Plugin Hover/Reveal-Actions, `searchTokens`) aktive Weiterentwicklung.

## Ressourcen / i18n

- YAML-Dateien liegen neben den Komponenten, die sie nutzen.
- Build mergt sie via `@educandu/dev-tools` nach `src/resources/resources.json`.
- Geteilte Keys in [src/resources/common.yml](../../src/resources/common.yml).
- `i18next` + `i18next-icu` (ICU-Format für Pluralisierung, Zahlen etc.).
