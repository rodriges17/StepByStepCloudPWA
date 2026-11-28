# Geräteordner in Step by Step

Wähle unter **Einstellungen → Speicherort** einen Geräteordner für neue Figuren. Der App-Speicher bleibt verfügbar. Diese technischen Details betreffen die Web-Apps. Für die Android-App siehe [Geräteordner unter Android](https://github.com/rodriges17/StepByStepCloudAndroid/blob/main/docs/NATIVE-ORDNERSCHREIBEN.md). [Schritt-für-Schritt-Anleitung](https://rodriges17.github.io/StepByStepCloudPWA/anleitungen/speicher.html)

## Unterstützung und Berechtigungen

Die App prüft showDirectoryPicker im sicheren Browserkontext. Ohne diese Fähigkeit gibt es keine auswählbare Ordneroption, sondern einen Hinweis auf aktuelles Chrome unter Android oder Desktop. Safari/iPhone verwendet weiterhin App-Speicher und ZIP-Sicherung. Der Betriebssystemdialog wird nur nach Antippen geöffnet. Nur der ausgewählte Ordner wird verwendet; Zugriffsrechte werden beim Öffnen geprüft. Bei fehlendem Zugriff bleiben zwischengespeicherte Figurenangaben sichtbar. Ordner erneut verbinden fordert Berechtigung auf ausdrücklichen Wunsch neu an. Bei verschobenem Ordner oder verlorener Browser-Datenbank Geräteordner auswählen verwenden.

## Dateien und Wiederherstellung

In einem neuen gewählten Ordner wird SalsaTrainer/library.json und ein Unterordner media verwendet. Ein bereits gewählter SalsaTrainer-Ordner mit library.json kann direkt geöffnet werden. Die Bibliotheksdatei enthält Titel, Beschreibungen, Tags, Lernstand, Zuordnungen, Video-Eigenschaften und Prüfsummen. Videodateien haben zufällige Namen und passende Dateiendungen wie .mp4 oder .mov. Für weitere Formate wird .media verwendet; die App speichert deren ursprünglichen Videotyp. Die ganze Bibliothek kann durch Kopieren des SalsaTrainer-Ordners gesichert und über die Ordnerwahl wieder eingelesen werden. Es findet keine automatische Cloud-Synchronisation des Ordners statt.

App- und Ordnerfiguren werden gemeinsam angezeigt. Für neue Figuren gilt der aktive Speicherort; vorhandene Figuren bleiben an ihrem bisherigen Ort. Eine bestehende Ordnerfigur wird beim Bearbeiten weiterhin im eigenen Ordner gespeichert. Auch bei gewähltem App-Speicher bleiben andere Ordnerfiguren zugreifbar, sofern Berechtigung besteht.

## Übertragen und Reparieren

Figur → Optionen → In Geräteordner übertragen beziehungsweise In App-Speicher übertragen. Die neue Kopie wird geschrieben und byteweise über eine gestückelte CRC-Prüfsumme geprüft. Erst danach kann die bisherige verwaltete Kopie ausdrücklich entfernt werden. Ursprüngliche Importdateien werden nie verändert. Beide behalten ist ebenfalls möglich. Bei Übertragung entsteht eine eigenständige Figur mit eigenem internen Schlüssel; Lernstand und Beschreibungen bleiben erhalten.

Fehlende oder extern veränderte Videos werden gekennzeichnet. Beim Bearbeiten bleiben Figurenangaben erhalten, Speichern ist bis zum Ersetzen und Bestätigen der Vorschau gesperrt. Neue Dateien werden zuerst geschrieben und geprüft, danach wird die Bibliotheksdatei über einen geschlossenen Schreibstream ersetzt. Bei zweifelhaftem Schreibabschluss werden möglicherweise referenzierte Dateien nicht gelöscht. Nicht mehr verwendete Dateien stehen in einer Bereinigungsliste und werden nach erfolgreichem Metadatenabschluss entfernt. Fehlgeschlagene Bereinigung wird beim nächsten Speichern oder Löschen wiederholt; eine reine Zugriffsfreigabe bereinigt keine Dateien. Fremde Dateien außerhalb dieser Liste werden nicht gelöscht.

## Grenzen

Die Bibliotheksdatei ist auf 8 MiB begrenzt. Vorhandene unbekannte Formate, Pfadtraversierung und widersprüchliche Dateiverweise werden abgewiesen. Mehrere Tabs derselben App verwenden die Web Locks API, sofern verfügbar. Derselbe Ordner sollte nicht gleichzeitig aus unterschiedlichen Browsern oder synchronisierten Gerätekopien bearbeitet werden. Ein Browser kann eine erneute Bestätigung des Ordnerzugriffs verlangen. Geräteordner liegen außerhalb der geschätzten Browser-Speicherquote; die Anzeige App-Speicher umfasst sie nicht.

## Gemeinsame Zugriffslogik

Figurenansicht, Speichereinstellungen und Backup verwenden dieselbe Zugriffsprüfung in `storage.js`. Die Oberfläche erhält nur Ordnerzusammenfassungen. Gespeicherte Handles und Bibliothekskataloge bleiben intern.

„Ordnerzugriff erlauben“ fragt die Berechtigung an, prüft die Bibliotheksidentität und aktualisiert ausschließlich die interne Metadatenkopie. Es schreibt keine Dateien im Geräteordner, löscht keine ausstehenden Dateien und ändert das Ziel für neue Figuren nicht. „Für neue Figuren verwenden“ setzt dieses Ziel weiterhin ausdrücklich. Ausstehende Dateibereinigung bleibt Bestandteil der Speicher- und Löschvorgänge.
