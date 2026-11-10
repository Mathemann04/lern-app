---
paths:
  - "src/state/**"
---

# Notizen: Speichern auf dem Gerät

Wörtlich aus CLAUDE.md (Abschnitt „Aufbau“) hierher verschoben. Claude Code lädt
diese Datei automatisch, sobald eine passende Datei gelesen oder geändert wird.
Neues Wissen über diesen Bereich gehört hierher, nicht in CLAUDE.md.

- `src/state/`: Speichern auf dem Gerät (`storage.ts`, Version 3, robust
  gegen kaputten Inhalt, alte Versionen werden umgezogen: bis Version 2
  gehört alles zum Ableiten), gemeinsamer Zustand (`store.ts`),
  Einstellungen (`settings.ts`: Stufe je Thema, zuletzt geübtes Thema,
  „Geführt"/„Frei" für alle, hell/dunkel, nicht angekreuzte Unterthemen
  `skipParts`, Mischung je Fach `mix`, zuletzt geübte Mischung `lastMix`) und Fortschritt je Thema mit
  Fehlerstatistik und 8-von-10-Vorschlag (`progress.ts`; höchstens 1000
  gelöste Aufgaben je Thema)
