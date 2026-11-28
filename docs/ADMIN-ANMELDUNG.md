# Admin-Anmeldung mit E-Mail und Passwort

Die aktuellen Schritte für die Cloud-Web-App und Android stehen in der [Anleitung für die Admin-Anmeldung](https://rodriges17.github.io/StepByStepCloudPWA/anleitungen/benutzerverwaltung.html#admin-passwort).

## Technische Prüfung

Sitzungen werden erst nach der serverseitigen Rollenprüfung übernommen. Ein fehlgeschlagener Versuch erhält eine bestehende Sitzung. Verworfene Kandidaten werden ausschließlich mit `scope=local` beendet; ein später Auth-Antwort kann weder eine Abmeldung noch eine neuere Anmeldung überschreiben. Bestehende Erneuerung, Konto-Cache-Trennung und Abmeldung bleiben erhalten.

## Bestätigung persönlicher Anmeldelinks

Persönliche Einmallinks bleiben gültig. Die App prüft den Link bei Supabase und zeigt die dort verifizierte E-Mail-Adresse. Erst nach ausdrücklicher Bestätigung wird die neue Sitzung gespeichert und für Cloud-Zugriffe verwendet. Bei einem Kontowechsel werden beide Konten angezeigt; eine Erneuerung desselben Kontos wird ebenfalls bestätigt. Fertige Access-/Refresh-Token aus URL-Fragmenten werden nicht mehr übernommen.

Bis zur Bestätigung bleibt das bisherige Konto aktiv. Der Sitzungskandidat bleibt nur im Arbeitsspeicher. Abbrechen, Escape, Android-Zurück und Schließen des Bestätigungsdialogs verwerfen ihn; ein bereits geprüfter Einmallink ist dann verbraucht. Ein Neuladen stellt keinen unbestätigten Kandidaten wieder her. Ungültige Links verändern die bestehende Anmeldung nicht. Ein abgebrochener Kandidat wird nach Möglichkeit serverseitig mit lokalem Logout widerrufen, ohne die bisherige Sitzung abzumelden.
