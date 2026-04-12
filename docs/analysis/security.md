# Sicherheit – Analyse

Stand: 2026-04-12
Commit: 67fb9ab4

Fokus auf sicherheitsrelevante Flows. Beobachtungen, keine Audit-Aussagen.

## Authentifizierung

### Lokal

- Passport `LocalStrategy` mit E-Mail + Passwort, Hashing via `bcrypt` (5.1.1).
- Eintritt: [src/server/user-controller.js](../../src/server/user-controller.js) (Routen ca. Z. 55–120).

### SAML

- `passport-saml` `MultiSamlStrategy` – mehrere IdPs parallel möglich.
- `SamlConfigService` holt Metadaten zur Laufzeit, parst X509-Zertifikate und SSO-Endpunkte mit `sax`.
- `LoadSamlMetadataJob` frischt Metadaten regelmäßig auf. Timeout auf Fetch: 30 s.
- Session-Laufzeit pro IdP über `expiryTimeoutInDays` (Default 180 Tage).
- Decryption-Keys (PVK/Cert) kommen aus `ServerConfig`.

### Brute-Force-Schutz

- `rateLimit`-Middleware auf Auth-Endpunkten mit Konstanten `ANTI_BRUTE_FORCE_MAX_REQUESTS` / `ANTI_BRUTE_FORCE_EXPIRES_IN_MS`.

## Autorisierung

Rollenbasiert, Definitionen in [src/domain/permissions.js](../../src/domain/permissions.js):

- Rollen: `user`, `accreditedAuthor`, `editor`, `maintainer`, `admin`.
- Beispiele: `admin` hat 13 Permissions inkl. `MANAGE_USERS`, `MANAGE_SETUP`, `BATCH_PROCESS_DATA`; `maintainer` hat 11 inkl. `UPLOAD_WITHOUT_RESTRICTION`.
- Middleware [src/domain/needs-permission-middleware.js](../../src/domain/needs-permission-middleware.js) prüft zuerst `req.isAuthenticated()` (→ 401), dann Permission (→ 403). Optional: `condition`-Funktion, die den Check überspringt.

## Session

- `express-session` + `connect-mongo` (5.1.0), Backing Store MongoDB.
- Config in [src/bootstrap/server-config.js](../../src/bootstrap/server-config.js): Secret, Cookie-Name, `secure`-Flag, Cookie-Domain, Default-Dauer 60 Minuten.
- Fallback-Secret: zufällig via `uniqueId.create()` – ungeeignet für Produktion, Config muss gesetzt sein.
- Post-Login-Redirect: SAML-Flow persistiert `redirect`-Query-Parameter über die Session.

## Datei-Uploads

- [src/domain/multipart-middleware.js](../../src/domain/multipart-middleware.js): `multer-s3` direkt nach S3.
- Workaround für [multer-s3#208](https://github.com/anacronw/multer-s3/issues/208) (fehlende File-Size) vorhanden.
- Limit: `STORAGE_FILE_UPLOAD_LIMIT_IN_BYTES` + 500 KB Puffer. Permission `UPLOAD_WITHOUT_RESTRICTION` hebelt das aus.
- MIME-Erkennung über `mime.getType()` auf dem Originalnamen – also dateiendungsbasiert, kein Content-Sniffing.
- Metadaten am Objekt: Upload-Zeitpunkt, User-ID.
- Temporärer Pfad: `${getTemporaryUploadsPath()}/upload_${createUniqueStorageFileName(file.originalname)}`.

## Input-Validierung

- 27 Joi-Schema-Dateien in [src/domain/schemas/](../../src/domain/schemas/).
- Wrapper [src/domain/validation-middleware.js](../../src/domain/validation-middleware.js) nutzt `express-joi-validation`, Fehler → 400, `passError`-Flag aktiviert.
- Schwachstellen: einzelne Felder nutzen `joi.any().allow(null)` (z. B. in `document-schemas.js`). `boolStringSchema` akzeptiert `true`/`false` als String oder Boolean – wirkt wie Legacy.

## CDN / S3-Zugriffe

- Alle Upload-/Schreib-Routen hinter `needsAuthentication()` oder `needsPermission()`.
- API-Keys über `ServerConfig` in den `Cdn`-Konstruktor.
- `MediaLibraryController` gated Queries per Permission-Check, Mapping über `ClientDataMappingService`.

## Secrets / Konfiguration

- Kein `.env`-Support im Framework selbst. Secrets werden vom einbettenden App-Projekt in `ServerConfig` gereicht – Joi validiert die Struktur.
- `basicAuthUsers`-Option schützt nicht-Produktions-Umgebungen.
- **Ausnahme:** `ServerConfig`-Schema akzeptiert `joi.any()` für `smtpOptions` – keine Strukturvalidierung für SMTP.

## Kein CSRF-Token

Kein dezidiertes CSRF-Middleware gefunden. Schutz beruht auf Session-Cookies (SameSite) + Passport-Handshake. Bei eingebetteten Iframes / Cross-Origin-Setups ist das ein Punkt, den ein Integrator explizit prüfen muss.

## XSS

- `htmlescape()` für die Server→Client-Payload in `window.__*__`-Globals.
- Markdown-Plugin nutzt `GithubFlavoredMarkdown` – Sanitizing-Verhalten dort nicht im Detail geprüft.
