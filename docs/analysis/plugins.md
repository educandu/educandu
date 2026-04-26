# Plugin-System – Analyse

Stand: 2026-04-12
Commit: 67fb9ab4

## Registrierung

- Zentrale Stelle: [src/plugins/plugin-registry.js](../../src/plugins/plugin-registry.js).
- Registriert werden 29 eingebaute Plugins + beliebig viele Custom-Plugins aus `customResolvers.resolveCustomPluginInfos()`.
- Plugin-Info-Klassen werden über den DI-Container instanziiert und können daher selbst Dependencies haben (z. B. `MarkdownInfo` → `GithubFlavoredMarkdown`).

## Contract (Plugin-Info-Klasse)

Pro Plugin existiert eine `*-info.js`. Referenz: [src/plugins/image/image-info.js](../../src/plugins/image/image-info.js).

**Statisch:**

- `typeName` – eindeutige ID, wird in gespeicherten Dokumenten referenziert. **Niemals ändern** ohne Migration.
- `dependencies` – DI-Liste.

**Methoden:**

| Methode | Zweck |
|---|---|
| `getDisplayName(t)` | Anzeigename (i18n) |
| `getIcon()` | React-Icon-Komponente |
| `resolveDisplayComponent()` | async, liefert Display-Komponente (lazy `import()`) |
| `resolveEditorComponent()` | async, liefert Editor-Komponente (lazy `import()`) |
| `getDefaultContent(t)` | Initial-Content für neue Sections |
| `validateContent(content)` | Joi-Validierung des persistierten Contents |
| `cloneContent(content)` | Deep-Clone für Duplizieren |
| `redactContent(content, targetRoomId)` | Filtert URLs nach Raum-Zugriff |
| `getCdnResources(content)` | Liefert S3-URLs für GC / Media-Tracking |
| `getTextRepresentation(content)` | Für Suche/Index |

## Begleit-Dateien pro Plugin

Im Plugin-Ordner (`src/plugins/<name>/`):

- `<name>-info.js` – Contract (s. o.).
- `<name>-display.js` – Display-Komponente.
- `<name>-editor.js` – Editor-Komponente.
- `<name>-icon.js` – Icon.
- `<name>.less` – Styles, optional, wird vom Build mit eingezogen.
- `<name>.yml` – Übersetzungen, optional, wird in `resources.json` gemerged.

## Caching / Preload

[src/plugins/registered-plugin.js](../../src/plugins/registered-plugin.js) wrappt jede Info-Instanz und cached geladene Display-/Editor-Komponenten in `ensureDisplayComponentIsLoaded()` / `ensureEditorComponentIsLoaded()`. Bootstrap ruft `pluginRegistry.ensureAllComponentsAreLoaded()`, sodass zur Request-Zeit nichts mehr dynamisch importiert wird.

## Custom Plugins einhängen

Via `customResolvers`-Objekt beim Bootstrap:

```js
customResolvers: {
  resolveCustomPluginInfos: () => [MyPluginInfo, ...],
  resolveCustomPageTemplate: ...,
  resolveCustomHomePageTemplate: ...,
  resolveCustomSiteLogo: ...
}
```

Nicht gesetzte Resolver fallen auf Defaults zurück (`DefaultPageTemplateComponent`, `DefaultSiteLogoComponent`).

## Eingebaute Plugins (Stand Commit 67fb9ab4)

Audio, Video, Image, Table, Iframe, Catalog, Markdown, PdfViewer, TextField, Separator, Whiteboard, Annotation, DiagramNet, QuickTester, AbcNotation, EarTraining, SelectField, AudioWaveform, MediaAnalysis, MatchingCards, MediaSlideshow, MusicXmlViewer, TableOfContents, FileUploadField, MultitrackMedia, InteractiveMedia, MusicAccentuation, MarkdownWithImage, CombinedMultitrackMedia.

## Hinweise für Custom-Plugin-Entwicklung

- **Kein offizielles Sample-Plugin** im Repo – beim Schreiben eines Custom-Plugins am ehesten `markdown` oder `image` als Vorlage nehmen.
- Der `validateContent()`-Check läuft auch beim Laden aus der DB – ein inkompatibles Schema-Update muss mit Migration der bestehenden Dokumente einhergehen.
- `getCdnResources()` ist wichtig für die Media-Library-Pflege (sonst werden referenzierte Dateien als verwaist behandelt und ggf. gelöscht).
