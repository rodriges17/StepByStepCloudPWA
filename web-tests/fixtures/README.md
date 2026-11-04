# Synthetische Testvideos

Diese kleinen H.264-Testvideos enthalten ausschliesslich das generierte FFmpeg-Testmuster. Sie werden versioniert, damit CI-Browserprüfungen keine Systeminstallation von FFmpeg benötigen. Die bisherigen Abmessungen, Laufzeiten und Codecs bleiben erhalten.

Bei Bedarf mit FFmpeg neu erzeugen:

```sh
ffmpeg -f lavfi -i testsrc2=size=320x180:rate=12 -t 6 -c:v libx264 -pix_fmt yuv420p -movflags +faststart web-tests/fixtures/clip.mp4
ffmpeg -f lavfi -i testsrc2=size=180x320:rate=12 -t 5 -c:v libx264 -pix_fmt yuv420p -movflags +faststart web-tests/fixtures/portrait.mp4
```

Vor dem erneuten Erzeugen vorhandene Ausgabedateien entfernen oder FFmpeg gezielt mit `-y` starten. Keine echten Nutzervideos in diesen Ordner aufnehmen.
