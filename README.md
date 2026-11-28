# Step by Step – Cloud-PWA

**Deine Schritte. Dein Tempo.** Speichere Tanzfiguren mit eigenen Videos, Beschreibungen und Tags. Übe mit lokal gespeicherten Figuren offline oder entdecke und teile Figuren über Cloud-Bibliotheken.

**[App öffnen](https://rodriges17.github.io/StepByStepCloudPWA/)** · **[Nutzeranleitungen](https://rodriges17.github.io/StepByStepCloudPWA/anleitungen/)**

## App nutzen

- **Installieren.** Auf Android in Chrome über **App installieren**, auf dem iPhone in Safari über **Zum Home-Bildschirm**. Auf dem Computer kannst du die App direkt im Browser öffnen.
- **Figuren verwalten.** Pro Figur kannst du mehrere Videos, eine Beschreibung, Tags und deinen Lernstand speichern. Suche und Filter helfen dir, Figuren wiederzufinden. [Figuren anlegen und üben](https://rodriges17.github.io/StepByStepCloudPWA/anleitungen/ueben.html)
- **Offline üben.** In **Cloud-Speicher → Bibliotheken** kannst du einzelne Figuren oder eine ganze Bibliothek lokal verfügbar machen. Nach dem Download findest du die Figuren unter **Figuren**. Der Lernplayer bietet Videowahl, Wiedergabetempo von 0,25× bis 1×, Zeitleiste, 5-Sekunden-Sprünge, Fit/Crop und eine A–B-Schleife.
- **Lokal speichern und sichern.** Figuren liegen im App-Speicher oder in einem Geräteordner, sofern der Browser Ordnerzugriff unterstützt. Ein Figuren-ZIP dient zum Teilen einzelner Figuren. Ein vollständiges Backup sichert auch persönliche Lernstände. [Speicher und Backup](https://rodriges17.github.io/StepByStepCloudPWA/anleitungen/speicher.html)

## Cloud-Bibliotheken

Öffentliche Bibliotheken kannst du ohne Konto öffnen. Private Bibliotheken erfordern eine Freigabe. Angemeldete Personen können eigene Figuren hochladen und in Bibliotheken verwenden. Eine Cloud-Figur hat einen aktuellen Inhalt, auf den mehrere Bibliotheken verweisen können. Der Besitzer und Plattformadministratoren können den Inhalt bearbeiten oder löschen.

- [Bibliotheken teilen](https://rodriges17.github.io/StepByStepCloudPWA/anleitungen/teilen.html)
- [Personen und Zugriff verwalten](https://rodriges17.github.io/StepByStepCloudPWA/anleitungen/benutzerverwaltung.html)

## Entwicklung

Die statische Web-App liegt in [`pwa/`](pwa/) und hat keinen Buildschritt. Die Supabase-Migrationen und die Edge Function `cloud` liegen in [`supabase/`](supabase/). Verwende Node.js 22 und Python 3 für die lokale Entwicklung.

```sh
npm ci
npm test
python3 -m http.server 4173
```

Öffne [localhost:4173/pwa/](http://localhost:4173/pwa/). Für die Browser-Tests beende den manuellen Server. Playwright startet seinen eigenen Testserver auf demselben Port.

```sh
npx playwright install chrome webkit
npm run test:browser
```

Der [Pages-Workflow](.github/workflows/pwa.yml) prüft Logik, Edge Function und Browser-Verhalten in Chromium und WebKit. Bei passenden Änderungen auf `main` folgt nach erfolgreichen Tests die Veröffentlichung auf GitHub Pages. Pull Requests führen die Prüfungen ohne Pages-Deployment aus. Änderungen an zwischengespeicherten App-Dateien brauchen eine neue Cache-Kennung in [`pwa/sw.js`](pwa/sw.js).

- [Supabase-Einrichtung](CLOUD-EINRICHTUNG.md#einrichtung-im-dashboard)
- [Figuren-Download](docs/FIGUREN-DOWNLOAD.md)
- [Technische Details zur Admin-Anmeldung](docs/ADMIN-ANMELDUNG.md)
- [Geräteordner](GERAETEORDNER.md) und [Backup](BACKUP.md)

## Weitere Varianten

- [Android-App mit Cloud-Speicher](https://github.com/rodriges17/StepByStepCloudAndroid)
- [Lokale PWA ohne Cloud-Speicher](https://github.com/rodriges17/StepByStepLocalPWA)
- [Native iPhone-App](https://github.com/rodriges17/StepByStepCloudIOS)
