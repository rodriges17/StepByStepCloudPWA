# Vollständiges lokales Backup

Das vollständige Backup steht in der Cloud-Web-App, der lokalen Web-App und der nativen Android-App zur Verfügung. Öffne **Einstellungen → Vollständiges Backup erstellen** oder **Backup wiederherstellen**. Der Figuren-ZIP-Austausch enthält keine Lernstände. [Schritt-für-Schritt-Anleitung](https://rodriges17.github.io/StepByStepCloudPWA/anleitungen/speicher.html)

## Inhalt

Gesichert werden alle lokal vorhandenen Figuren aus App-Speicher und verbundenen Geräteordnern: Original-Videobytes, Reihenfolge, Videonamen, Dauer/Abmessungen, Vorschaubilder, Titel, Beschreibungen, Tags, Lernstände und ursprüngliche Erstellungsdaten. Cloud-Figuren ohne lokale Kopie gehören nicht zum lokalen Bestand. Anmeldedaten, Sitzungen, native Ordnerhandles, Berechtigungen und private Browser-Cache-Pfade werden nicht gesichert.

Vor der Erstellung wird der gesamte Bestand gelesen. Fehlende oder veränderte Ordnerdateien verhindern die Erstellung einer als vollständig bezeichneten Sicherung. Zuerst Ordner erneut verbinden oder die betroffenen Videos reparieren. Während der Sammlung sperrt dieselbe App Schreibvorgänge über Web Locks, sofern der Browser sie unterstützt; Revisionen werden zusätzlich erneut geprüft.

## Dateien

Eigenes Format .salsabackup, Version 1, Magic SALSABK1. Kleine Bestände ergeben eine Datei, große Bestände zusammengehörige Teile mit jeweils höchstens 250 MiB. Auch einzelne Videos über dieser Größe werden geteilt. Die Blöcke werden bis 8 MiB gehasht, nicht als ganzes Video in ein zusätzliches JavaScript-Array eingelesen. Die Dateien sind nicht verschlüsselt. Alle Teile müssen zusammen aufbewahrt werden.

Der erste Teil enthält ein begrenztes JSON-Verzeichnis; alle Teile enthalten Sicherungs-ID, Nummer, Gesamtzahl und denselben Verzeichnis-Hash. Jeder Nutzdatenblock wird mit SHA-256 geprüft. Lücken, Überlappungen, fremde oder doppelte Teile, unbekannte Versionen, ungültige Angaben, abgeschnittene Dateien und zusätzliche Daten werden abgewiesen. Es gibt keine aus dem Backup übernommenen Dateipfade.

Die App bietet jeden Teil separat zum Download an. Download angefordert ist keine Bestätigung des tatsächlichen Speicherns. Zuletzt erstellt am bezeichnet nur den Erstellungszeitpunkt. Die internen mobilen Browsergrenzen können trotz begrenzter Teilgröße variieren; kein unbegrenzt großer Gesamtbestand wird garantiert. Das Verzeichnis ist auf 16 MiB, 10000 Figuren und 100000 Dateieinträge begrenzt.

## Wiederherstellung

Alle Teile auswählen. Vor jeder Änderung werden sämtliche Dateien und Figurenangaben geprüft. Danach Ziel auswählen: App-Speicher oder ein bereits eingerichteter, unterstützter Geräteordner. Nicht unterstützte Browser bieten ausschließlich App-Speicher an. Der ursprüngliche Geräteordner aus dem Backup ist nicht erforderlich.

Konflikte beziehen sich auf den gewählten Zielspeicher. Figuren an anderen Speicherorten bleiben unverändert. Identische Figuren werden standardmäßig übersprungen. Abweichende Figuren, auch bei unterschiedlichem Lernstand oder Datum, sind Konflikte. Standard ist Vorhandene behalten; weitere Optionen sind Zusätzliche Kopie und ausdrücklich Ersetzen einer konkreten Figur. Interne Austausch-Fingerprints werden nicht als alleinige Duplikatkennung verwendet; unabhängige lokale Kopien bleiben in der Sicherung getrennt enthalten.

Alle neuen Videos werden zunächst geschrieben und erneut geprüft. App-Speicher: ein gemeinsamer IndexedDB-Abschluss übernimmt alle Figuren; Fehler oder Abbruch davor entfernen die neu gestagten Cachedateien. Geräteordner: erst nach sämtlichen Kopien wird die Bibliotheksdatei einmal ersetzt; nicht mehr benötigte Dateien werden danach bereinigt. Veraltete Wiederherstellungspläne werden abgewiesen. Bei einem unklaren Dateischreibabschluss werden möglicherweise noch referenzierte Dateien nicht gelöscht. Die vorhandenen ursprünglichen Importdateien außerhalb der App werden nie angefasst.

## Ablauf und Darstellung

`backup-workflow.js` steuert Erstellung und Wiederherstellung unabhängig vom DOM: Freigaben, Bestandsbindung, erneute Prüfung vor Export, Dateiprüfung, Zielwechsel, Konfliktauswahl, Bestätigung und Abbruch. Persistenz bleibt in `storage.js`, das Dateiformat in `backup-format.js`. `backup-ui.js` stellt Zustände dar und übernimmt Dateiauswahl, Download-Links sowie die lokale Anzeige des letzten Erstellungsdatums.

Zielwechsel und neue Sicherungsdateien verwerfen den bisherigen Wiederherstellungsplan. Parallele Aktionen sind gesperrt; späte Ergebnisse nach Abbruch werden nicht als erfolgreicher Prüfstand angezeigt. Ab dem endgültigen Speicherabschluss ist Abbrechen gesperrt. Zehn direkte Ablaufprüfungen mit einem Speicher-Testadapter decken diese Regeln ab; die bestehenden Browserprüfungen sichern weiterhin Bedienung, Berechtigungsanbindung, Dateiauswahl und Downloads ab.

## Medienkopien und Fehlerbereinigung

App-Speicher und Geräteordner verwenden innerhalb ihres jeweiligen Speichermoduls denselben Medien-Staging-Ablauf für Speichern und Wiederherstellen. Neue Kopien werden vor dem Metadatenabschluss auf Größe und Prüfsumme geprüft. App-Speicher behält sein Importjournal und den atomaren IndexedDB-Abschluss; Geräteordner behalten den Katalogabschluss und die vorsichtige Bereinigung anhand des tatsächlich lesbaren Katalogs. Bei mehrdeutigem Katalogabschluss werden neu referenzierte Dateien niemals als fehlgeschlagene Kopien entfernt. Die Dateiformate und der Anmeldezustand bleiben davon unabhängig.
