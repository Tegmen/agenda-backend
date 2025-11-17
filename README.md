# Agenda Backend

Node.js backend für die Agenda PWA - ein System für Schüler, Lehrer und Schulleitung zur Verwaltung von Hausaufgaben, Terminen und Ereignissen.

## Funktionen

- **Benutzerrollen**: Schüler, Lehrer, Schulleitung, Admin
- **Gruppenverwaltung**: Benutzer können mehreren Gruppen angehören
- **Einträge**: Hausaufgaben, Events, Prüfungen, Erinnerungen
- **Soft Delete**: Einträge werden markiert statt gelöscht (Bearbeitungshistorie)
- **Wochenbasiertes Laden**: Effiziente Abfrage nach Kalenderwochen
- **Berechtigungssystem**: Rollenbasierte Zugriffskontrolle

## Tech Stack

- **Node.js** 20.x LTS
- **Express.js** - Web Framework
- **Prisma** - ORM für MySQL/MariaDB
- **JWT** - Authentication
- **bcryptjs** - Password Hashing
- **MariaDB** - Datenbank

## Voraussetzungen

- Node.js 20.x oder höher
- MySQL oder MariaDB Datenbank
- npm oder yarn

## Installation (Lokal)

### 1. Repository klonen

```bash
git clone <repository-url>
cd agenda-backend
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren

Kopiere `.env.example` zu `.env` und passe die Werte an:

```bash
cp .env.example .env
```

Bearbeite `.env`:

```env
# Datenbank-Verbindungsstring
DATABASE_URL="mysql://benutzername:passwort@localhost:3306/agenda"

# JWT Secret (generiere einen zufälligen String)
JWT_SECRET="dein-sehr-sicheres-geheimnis-hier"

# Server-Konfiguration
PORT=3000
NODE_ENV=development

# CORS Origins (komma-getrennt)
CORS_ORIGIN="http://localhost:8080,https://agenda.brändli.org"
```

### 4. Datenbank erstellen

Erstelle eine MySQL/MariaDB Datenbank:

```sql
CREATE DATABASE agenda CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 5. Datenbank migrieren

```bash
npx prisma migrate dev --name init
```

Dies erstellt alle Tabellen in der Datenbank.

### 6. Ersten Admin-Benutzer erstellen

Nach der Migration kannst du einen Admin-Benutzer direkt in der Datenbank erstellen oder das folgende Node.js Script verwenden (siehe unten).

### 7. Server starten

**Entwicklung** (mit Auto-Reload):
```bash
npm run dev
```

**Produktion**:
```bash
npm start
```

Der Server läuft auf `http://localhost:3000` (oder dem in .env konfigurierten Port).

## Deployment auf Spaceship.com

### 1. Vorbereitung

Stelle sicher, dass du:
- Zugang zu deinem Spaceship.com Hosting-Account hast
- cPanel Zugriff hast
- Eine MariaDB Datenbank erstellt hast

### 2. Datenbank erstellen in cPanel

1. Logge dich in cPanel ein
2. Gehe zu **MySQL® Databases**
3. Erstelle eine neue Datenbank: `agenda`
4. Erstelle einen Datenbankbenutzer mit einem sicheren Passwort
5. Füge den Benutzer zur Datenbank hinzu mit **ALL PRIVILEGES**
6. Notiere dir:
   - Datenbankname (z.B. `username_agenda`)
   - Benutzername (z.B. `username_agendauser`)
   - Passwort
   - Hostname (meist `localhost`)

### 3. Dateien hochladen

1. Lade alle Projekt-Dateien via FTP/SFTP oder cPanel File Manager hoch
2. Verzeichnisstruktur auf dem Server:
   ```
   /home/username/
   ├── public_html/          # Dein Frontend hier
   └── agenda-backend/       # Backend-Dateien hier
   ```

### 4. Node.js App in cPanel einrichten

1. Gehe in cPanel zu **Setup Node.js App**
2. Erstelle eine neue App:
   - **Node.js version**: 20.x
   - **Application mode**: Production
   - **Application root**: `/home/username/agenda-backend`
   - **Application URL**: `agenda-api.brändli.org` (oder Subdomain)
   - **Application startup file**: `src/index.js`
3. Klicke auf **CREATE**

### 5. Umgebungsvariablen setzen

In der Node.js App Verwaltung, füge folgende Environment Variables hinzu:

```
DATABASE_URL=mysql://username_agendauser:passwort@localhost:3306/username_agenda
JWT_SECRET=dein-sehr-sicheres-zufälliges-geheimnis
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://agenda.brändli.org
```

### 6. Dependencies installieren via SSH

1. Verbinde dich via SSH zu deinem Server
2. Navigiere zum Backend-Verzeichnis:
   ```bash
   cd ~/agenda-backend
   ```
3. Installiere Dependencies:
   ```bash
   npm install
   ```
4. Generiere Prisma Client:
   ```bash
   npx prisma generate
   ```
5. Führe Datenbank-Migration aus:
   ```bash
   npx prisma migrate deploy
   ```

### 7. App starten

In cPanel Node.js App Manager, klicke auf **RESTART** für deine App.

### 8. Ersten Admin-Benutzer erstellen

Verbinde dich via SSH und führe aus:

```bash
cd ~/agenda-backend
node scripts/createAdmin.js
```

Oder erstelle den Admin manuell in der Datenbank:

```sql
-- Passwort hashen (Beispiel für 'admin123')
-- Nutze bcrypt online hash generator mit 10 Runden

INSERT INTO User (username, password, role)
VALUES ('admin', '$2a$10$hashedPasswordHier', 'ADMIN');
```

### 9. Testen

Teste die API:

```bash
curl https://agenda-api.brändli.org/health
```

Erwartete Antwort:
```json
{
  "status": "ok",
  "timestamp": "2025-11-17T...",
  "environment": "production"
}
```

## Erstellen eines Admin-Benutzers (Script)

Erstelle die Datei `scripts/createAdmin.js`:

```javascript
import prisma from '../src/utils/db.js';
import { hashPassword } from '../src/utils/auth.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    const username = await question('Admin-Benutzername: ');
    const password = await question('Admin-Passwort: ');

    if (!username || !password) {
      console.log('Benutzername und Passwort sind erforderlich');
      process.exit(1);
    }

    const hashedPassword = await hashPassword(password);

    const admin = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    console.log(`✅ Admin-Benutzer "${admin.username}" erfolgreich erstellt!`);
  } catch (error) {
    console.error('❌ Fehler beim Erstellen des Admins:', error.message);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

createAdmin();
```

Dann ausführen:
```bash
node scripts/createAdmin.js
```

## API Endpoints

### Authentication

- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Aktueller Benutzer
- `POST /api/auth/change-password` - Passwort ändern

### Users (PRINCIPAL, ADMIN)

- `GET /api/users` - Alle Benutzer
- `GET /api/users/:id` - Einzelner Benutzer
- `POST /api/users` - Benutzer erstellen
- `PUT /api/users/:id` - Benutzer aktualisieren
- `DELETE /api/users/:id` - Benutzer löschen (nur ADMIN)

### Groups

- `GET /api/groups` - Alle Gruppen (gefiltert nach Rolle)
- `GET /api/groups/:id` - Einzelne Gruppe
- `GET /api/groups/:id/members` - Gruppenmitglieder
- `POST /api/groups` - Gruppe erstellen (PRINCIPAL, ADMIN)
- `PUT /api/groups/:id` - Gruppe aktualisieren (PRINCIPAL, ADMIN)
- `DELETE /api/groups/:id` - Gruppe löschen (PRINCIPAL, ADMIN)
- `POST /api/groups/:id/members` - Mitglied hinzufügen (PRINCIPAL, ADMIN)
- `DELETE /api/groups/:id/members/:userId` - Mitglied entfernen (PRINCIPAL, ADMIN)

### Entries

- `GET /api/entries/week/:year/:week` - Einträge für Kalenderwoche
- `GET /api/entries/:id` - Einzelner Eintrag
- `GET /api/entries/deleted` - Gelöschte Einträge (TEACHER+)
- `POST /api/entries` - Eintrag erstellen
- `PUT /api/entries/:id` - Eintrag bearbeiten
- `DELETE /api/entries/:id` - Eintrag löschen

## Datenbank Schema

### User
- id, username, password (hashed), role, createdAt, updatedAt

### Group
- id, name, createdAt, updatedAt

### UserGroup (Junction Table)
- userId, groupId, addedAt

### Entry
- id, title, description, displayDate, type, groupId, createdById, editedById, createdAt, updatedAt, isDeleted, deletedAt

## Rollen & Berechtigungen

### STUDENT
- Einträge für eigene Gruppen erstellen
- Eigene Einträge bearbeiten/löschen (soft delete)
- Einträge der eigenen Gruppen sehen (nur nicht-gelöschte)

### TEACHER
- Wie STUDENT, aber:
- Alle Einträge der eigenen Gruppen bearbeiten/löschen
- Gelöschte Einträge sehen

### PRINCIPAL
- Alle Einträge aller Gruppen sehen/bearbeiten/löschen
- Benutzer und Gruppen verwalten

### ADMIN
- Wie PRINCIPAL, aber:
- Einträge permanent löschen
- Benutzer permanent löschen

## Troubleshooting

### "Failed to fetch Prisma binaries"
Dies ist normal in einer eingeschränkten Entwicklungsumgebung. Der Prisma Client wird automatisch auf dem Server generiert.

### "Connection refused" bei Datenbankverbindung
- Überprüfe `DATABASE_URL` in `.env`
- Stelle sicher, dass die Datenbank existiert
- Überprüfe Benutzername/Passwort

### JWT Token Fehler
- Stelle sicher, dass `JWT_SECRET` in `.env` gesetzt ist
- Token könnte abgelaufen sein (7 Tage Gültigkeit)

### CORS Fehler
- Überprüfe `CORS_ORIGIN` in `.env`
- Füge die Frontend-URL hinzu

## Entwicklung

### Prisma Studio (Datenbank GUI)
```bash
npm run prisma:studio
```

### Neue Migration erstellen
```bash
npx prisma migrate dev --name beschreibung
```

### Datenbank zurücksetzen (ACHTUNG: Löscht alle Daten!)
```bash
npx prisma migrate reset
```

## Lizenz

MIT

## Kontakt

Bei Fragen oder Problemen, erstelle ein Issue im Repository.
