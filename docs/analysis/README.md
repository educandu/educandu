# Educandu – Analyse-Dokumentation für Claude

Dieser Ordner enthält eingecheckte Analysen des Repositories, die von Claude Code beim Arbeiten am Projekt gelesen und gepflegt werden sollen. Ziel: geteiltes Wissen über Rechner und Personen hinweg, damit weder Claude noch ein später hinzukommender Entwickler bei Null anfangen muss.

## Inhalt

- [architecture.md](architecture.md) – Detailanalyse der Architektur (DI, Controller, SSR/Hydration, Job-Scheduler)
- [security.md](security.md) – Authentifizierung, Autorisierung, Session, Uploads, Validierung
- [plugins.md](plugins.md) – Plugin-System, Contract, eingebaute Plugins, Custom Plugins
- [open-issues.md](open-issues.md) – Bekannte Probleme, Unschärfen, Verbesserungswünsche

## Kopfzeile jeder Datei

Jede Analysedatei trägt oben einen Block:

```
Stand: <YYYY-MM-DD>
Commit: <short-hash>
```

Das ist die Referenz darauf, welchen Stand des Codes die Analyse beschreibt. Ohne diesen Block ist der Inhalt nicht mehr belastbar.

## Regel: Aktualisieren bei Änderungen (Vorschlag)

**Wer den Code in einem Bereich substantiell ändert, aktualisiert die betroffene Analysedatei im selben Pull Request.**

Konkret:

1. **Vor der Arbeit lesen:** Claude soll bei nicht-trivialen Aufgaben die thematisch passende(n) Datei(en) aus `docs/analysis/` lesen, bevor er Code ändert.
2. **Nach der Arbeit aktualisieren:** Wenn die Änderung eine Aussage in einer Analysedatei betrifft (z. B. neue Middleware, geändertes Plugin-Contract, neuer Permission-Eintrag, behobenes Open Issue), dann:
   - Betroffene Stellen in der Datei anpassen.
   - Kopf aktualisieren: `Stand: <heute>`, `Commit: <neuer HEAD nach Merge>` (Platzhalter `HEAD` ist erlaubt, wird vom Maintainer beim Merge gesetzt — oder nachträglich per Follow-up-Commit).
   - Bei `open-issues.md`: erledigte Punkte in einen Abschnitt `## Erledigt` verschieben oder mit Commit-Hash entfernen.
3. **Reine Analysearbeit:** Wenn Claude ohne Code-Änderung eine neue Erkenntnis gewinnt (z. B. durch eine Frage des Nutzers), darf er die Analysedatei als eigenen Commit aktualisieren.
4. **Zweifel:** Wenn unklar ist, ob eine Aussage noch stimmt, lieber den Code prüfen als blind auf die Analyse vertrauen. Veraltete Aussagen werden korrigiert, nicht nur markiert.
5. **Konsistenz mit `CLAUDE.md`:** Die `CLAUDE.md` im Repo-Root bleibt der kurze Einstieg. Wenn sich dort etwas ändert, ist zu prüfen, ob `architecture.md` mitgezogen werden muss — und umgekehrt.

Diese Regel ist auch in der `CLAUDE.md` verlinkt, damit Claude sie in jeder Session sieht.
