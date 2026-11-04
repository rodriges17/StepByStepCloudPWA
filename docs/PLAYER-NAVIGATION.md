# Navigation im geöffneten Lernplayer

Umsetzung zu StepByStepCloudPWA #88 und #89; gilt auch für StepByStepCloudAndroid.

- Solange eine Figur im Lernplayer geöffnet ist, ist die gesamte App-Hauptnavigation ausgeblendet. Nach dem Schliessen kehrt sie zurück. Der Platz wird für den Player genutzt.
- Vollbild startet mit verborgenen Bedienleisten. Hochwischen zeigt sie als Overlay, Herunterwischen verbirgt sie. Die bisherigen Gesten und der automatische Ausblendtimer bleiben erhalten.
- Zurück bei sichtbarem Vollbildmenü verbirgt zuerst das Menü. Weiteres Zurück verlässt das Vollbild; erst danach wird die Figur geschlossen. Wiedergabeposition und Lerneinstellungen bleiben beim Verlassen des Vollbilds erhalten.
- Native Android-App: Statusleiste im Vollbild ausblenden, Navigation explizit sichtbar halten. Navigationshintergrund transparent, helle Systemicons; Sicherheitsabstände aus tatsächlichen Insets. Normalmodus stellt beide Systemleisten wieder her.
- Android-PWA: Der Player nutzt den vorhandenen CSS-Vollbildmodus innerhalb der Browser-/PWA-Fläche anstelle der immersiven Browser-Fullscreen-API. So fordert die App kein Ausblenden der Systemnavigation an. Die PWA kann Android-Systemleisten weder unabhängig steuern noch ihre Transparenz erzwingen. Insbesondere kann die obere Statusleiste sichtbar bleiben. Die vorhandenen Browser-Sicherheitsabstände schützen das Menü. Die native App verwendet weiterhin den Android-Plattformadapter.
- Andere Browser behalten den bisherigen Container-Vollbildmodus mit dem vorhandenen Fallback.

Systemleisten benötigen eine Prüfung auf Android mit Drei-Tasten- und Gestennavigation. DOM-/Browserprüfungen ersetzen diese Geräteprüfung nicht.

Bestätigter Prototyp: https://step-by-step-player-prototyp.patrick-kraus30946.chatgpt.site
