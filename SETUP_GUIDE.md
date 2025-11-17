# Schritt-für-Schritt Setup Guide

Diese Anleitung führt dich durch die komplette Einrichtung des Agenda Backends auf Spaceship.com.

## Teil 1: Vorbereitung (auf deinem Computer)

### 1. Projekt herunterladen

Falls noch nicht geschehen:
```bash
git clone <repository-url>
cd agenda-backend
```

### 2. Lokale Konfiguration (Optional, zum Testen)

Wenn du das Backend lokal testen möchtest:

```bash
# Dependencies installieren
npm install

# .env Datei erstellen
cp .env.example .env
```

Bearbeite `.env` und füge deine lokale Datenbankverbindung ein.

## Teil 2: Spaceship.com Setup

### Schritt 1: Bei Spaceship.com einloggen

1. Gehe zu https://www.spaceship.com
2. Logge dich in deinen Account ein
3. Klicke auf **Hosting Manager**

### Schritt 2: Datenbank erstellen

1. Im Hosting Manager, klicke auf **Manage** neben deiner Domain
2. Scrolle runter zu **Advanced** → **MySQL® Databases**
3. **Neue Datenbank erstellen:**
   - Database Name: `agenda`
   - Klicke **Create Database**
   - **WICHTIG**: Notiere dir den vollständigen Datenbanknamen (z.B. `username_agenda`)

4. **Neuen Datenbankbenutzer erstellen:**
   - Username: `agendauser` (oder ein anderer Name)
   - Password: Wähle ein sicheres Passwort
   - Password Strength: Muss mindestens "Good" sein
   - Klicke **Create User**
   - **WICHTIG**: Notiere dir:
     - Vollständiger Username (z.B. `username_agendauser`)
     - Passwort (speichere es sicher!)

5. **Benutzer zur Datenbank hinzufügen:**
   - Unter "Add User To Database"
   - Wähle den gerade erstellten User
   - Wähle die gerade erstellte Datenbank
   - Klicke **Add**
   - Im nächsten Fenster: Wähle **ALL PRIVILEGES**
   - Klicke **Make Changes**

### Schritt 3: Backend-Dateien hochladen

**Option A: Via File Manager (einfacher)**

1. Im Hosting Manager → **Files** → **File Manager**
2. Navigiere zu deinem Home-Verzeichnis
3. Erstelle einen neuen Ordner: `agenda-backend`
4. Lade alle Dateien aus deinem lokalen Projekt in diesen Ordner hoch
   - Markiere alle Dateien und ziehe sie in den Browser
   - ODER nutze die Upload-Funktion

**Option B: Via FTP (für größere Dateien)**

1. Im Hosting Manager → **Files** → **FTP Accounts**
2. Nutze die Hauptaccount-Credentials
3. Verbinde dich mit einem FTP-Client (z.B. FileZilla):
   - Host: `ftp.deinedomain.de`
   - Username: dein Hauptaccount-Name
   - Password: dein Passwort
   - Port: 21
4. Lade alle Projekt-Dateien in einen Ordner `agenda-backend` hoch

### Schritt 4: Node.js App einrichten

1. Im Hosting Manager → **Advanced** → **Setup Node.js App**
2. Klicke **CREATE APPLICATION**
3. Fülle das Formular aus:
   - **Node.js version**: Wähle die höchste verfügbare Version (20.x oder höher)
   - **Application mode**: `Production`
   - **Application root**: Klicke auf das Ordner-Icon und wähle `agenda-backend`
   - **Application URL**:
     - Option 1: Nutze eine Subdomain wie `api.deinedomain.de`
     - Option 2: Nutze einen Pfad wie `deinedomain.de/api`
   - **Application startup file**: `src/index.js`
4. Klicke **CREATE**

### Schritt 5: Umgebungsvariablen setzen

1. In der Node.js App Liste, klicke auf **EDIT** bei deiner App
2. Scrolle runter zu **Environment variables**
3. Füge folgende Variablen hinzu (klicke jeweils auf **Add variable**):

```
Name: DATABASE_URL
Value: mysql://username_agendauser:deinPasswort@localhost:3306/username_agenda

Name: JWT_SECRET
Value: [Generiere einen zufälligen String - siehe unten]

Name: PORT
Value: 3000

Name: NODE_ENV
Value: production

Name: CORS_ORIGIN
Value: https://agenda.brändli.org
```

**JWT_SECRET generieren:**
- Gehe zu https://www.uuidgenerator.net/
- Kopiere einen der generierten UUIDs
- ODER nutze eine lange zufällige Zeichenkette (mindestens 32 Zeichen)

4. Klicke **SAVE** nach jeder Variable

### Schritt 6: SSH-Zugriff aktivieren (falls noch nicht aktiv)

1. Im Hosting Manager → **Advanced** → **SSH Access**
2. Aktiviere SSH falls noch nicht geschehen
3. Notiere dir die SSH-Zugangsdaten

### Schritt 7: Via SSH verbinden und Dependencies installieren

**Windows:**
- Nutze PuTTY oder Windows Terminal
- Host: SSH-Host aus Schritt 6
- Port: 22
- Username: Dein Account-Name
- Password: Dein Passwort

**Mac/Linux:**
```bash
ssh username@host
```

**Nach der Verbindung:**

```bash
# Zum Backend-Verzeichnis navigieren
cd ~/agenda-backend

# Dependencies installieren
npm install

# Prisma Client generieren
npx prisma generate

# Datenbank-Schema erstellen (Migration)
npx prisma migrate deploy
```

**Falls `npm install` einen Fehler wirft:**
```bash
# Versuche mit Node Version Manager
source ~/.bashrc
nvm use 20  # oder die Version, die du in cPanel gewählt hast
npm install
```

### Schritt 8: Admin-Benutzer erstellen

Noch in der SSH-Verbindung:

```bash
node scripts/createAdmin.js
```

Folge den Anweisungen:
- Gib einen Admin-Benutzernamen ein (z.B. `admin`)
- Gib ein sicheres Passwort ein (mindestens 6 Zeichen)

### Schritt 9: App starten

1. Zurück im Browser: Hosting Manager → **Setup Node.js App**
2. Klicke **RESTART** bei deiner App
3. Warte ca. 30 Sekunden

### Schritt 10: Testen!

Öffne in deinem Browser:
```
https://deine-app-url/health
```

Du solltest eine Antwort wie diese sehen:
```json
{
  "status": "ok",
  "timestamp": "2025-11-17T...",
  "environment": "production"
}
```

🎉 **Glückwunsch! Dein Backend läuft!**

## Teil 3: Login testen

### Via Browser-Console oder Postman:

**Login-Request:**
```
POST https://deine-app-url/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "dein-passwort"
}
```

Du solltest einen Token zurückbekommen:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "ADMIN"
  }
}
```

## Häufige Probleme

### Problem: "Cannot find module '@prisma/client'"

**Lösung:**
```bash
cd ~/agenda-backend
npx prisma generate
# Restart app in cPanel
```

### Problem: "Database connection failed"

**Lösung:**
- Überprüfe `DATABASE_URL` in den Environment Variables
- Stelle sicher, dass alle Werte korrekt sind (kein Leerzeichen)
- Format: `mysql://username:password@localhost:3306/databasename`

### Problem: "App won't start" / "502 Bad Gateway"

**Lösung:**
1. Überprüfe die App-Logs in cPanel (Setup Node.js App → klicke auf deine App → **Logs**)
2. Stelle sicher, dass alle Environment Variables gesetzt sind
3. Überprüfe, dass `src/index.js` als Startup File konfiguriert ist
4. Versuche die App neu zu starten

### Problem: "CORS Error" vom Frontend

**Lösung:**
- Füge die Frontend-URL zu `CORS_ORIGIN` hinzu
- Format: `https://domain1.de,https://domain2.de` (komma-getrennt, keine Leerzeichen)
- Restart App

## Nächste Schritte

1. **Gruppen erstellen**: Nutze die API oder erstelle sie direkt in der Datenbank
2. **Benutzer erstellen**: Via API als Admin
3. **Frontend verbinden**: Konfiguriere dein Frontend mit der Backend-URL
4. **SSL-Zertifikat**: Stelle sicher, dass deine Domain ein SSL-Zertifikat hat (meist automatisch bei Spaceship)

## Nützliche Befehle

### Logs anschauen (SSH)
```bash
cd ~/agenda-backend
# Node.js App logs sind in cPanel verfügbar
```

### Datenbank-Backup erstellen
```bash
# In cPanel: phpMyAdmin → Datenbank auswählen → Export
```

### App neu starten
```bash
# In cPanel: Setup Node.js App → RESTART
# ODER via SSH:
cd ~/agenda-backend
touch tmp/restart.txt
```

## Support

Bei Fragen oder Problemen:
1. Überprüfe die Logs in cPanel
2. Überprüfe die Environment Variables
3. Erstelle ein Issue im GitHub Repository
4. Kontaktiere Spaceship Support bei Hosting-spezifischen Fragen

---

**Viel Erfolg! 🚀**
