# API Dokumentation

## Basis-URL

**Entwicklung:** `http://localhost:3000`
**Produktion:** `https://deine-domain.de/api`

## Authentifizierung

Die meisten Endpoints benötigen einen JWT-Token im `Authorization` Header:

```
Authorization: Bearer <token>
```

Den Token erhältst du nach erfolgreichem Login.

---

## Authentication Endpoints

### Login

**POST** `/api/auth/login`

**Request Body:**
```json
{
  "username": "admin",
  "password": "passwort123"
}
```

**Response:** `200 OK`
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

**Error:** `401 Unauthorized`
```json
{
  "error": "Ungültige Anmeldedaten"
}
```

---

### Aktuellen Benutzer abrufen

**GET** `/api/auth/me`

**Headers:**
```
Authorization: Bearer <token>
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "username": "admin",
  "role": "ADMIN",
  "createdAt": "2025-11-17T10:00:00.000Z"
}
```

---

### Passwort ändern

**POST** `/api/auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "currentPassword": "altesPasswort",
  "newPassword": "neuesPasswort123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Passwort erfolgreich geändert"
}
```

---

## User Management Endpoints

### Alle Benutzer abrufen

**GET** `/api/users`

**Berechtigung:** PRINCIPAL, ADMIN

**Query Parameters:**
- `role` (optional): Filter nach Rolle (STUDENT, TEACHER, PRINCIPAL, ADMIN)

**Beispiel:** `/api/users?role=STUDENT`

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "username": "max.mueller",
    "role": "STUDENT",
    "createdAt": "2025-11-17T10:00:00.000Z"
  },
  {
    "id": 2,
    "username": "anna.schmidt",
    "role": "TEACHER",
    "createdAt": "2025-11-17T10:05:00.000Z"
  }
]
```

---

### Einzelnen Benutzer abrufen

**GET** `/api/users/:id`

**Response:** `200 OK`
```json
{
  "id": 1,
  "username": "max.mueller",
  "role": "STUDENT",
  "createdAt": "2025-11-17T10:00:00.000Z",
  "groups": [
    {
      "userId": 1,
      "groupId": 5,
      "addedAt": "2025-11-17T11:00:00.000Z",
      "group": {
        "id": 5,
        "name": "Klasse 10A",
        "createdAt": "2025-11-17T09:00:00.000Z"
      }
    }
  ]
}
```

---

### Benutzer erstellen

**POST** `/api/users`

**Berechtigung:** PRINCIPAL, ADMIN

**Request Body:**
```json
{
  "username": "max.mueller",
  "password": "passwort123",
  "role": "STUDENT"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "username": "max.mueller",
  "role": "STUDENT",
  "createdAt": "2025-11-17T10:00:00.000Z"
}
```

**Error:** `400 Bad Request`
```json
{
  "error": "Benutzername bereits vergeben"
}
```

---

### Benutzer aktualisieren

**PUT** `/api/users/:id`

**Berechtigung:** PRINCIPAL, ADMIN

**Request Body:** (alle Felder optional)
```json
{
  "username": "max.mueller.neu",
  "password": "neuesPasswort",
  "role": "TEACHER"
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "username": "max.mueller.neu",
  "role": "TEACHER",
  "createdAt": "2025-11-17T10:00:00.000Z"
}
```

---

### Benutzer löschen

**DELETE** `/api/users/:id`

**Berechtigung:** ADMIN

**Response:** `200 OK`
```json
{
  "message": "Benutzer erfolgreich gelöscht"
}
```

**Error:** `400 Bad Request`
```json
{
  "error": "Sie können sich nicht selbst löschen"
}
```

---

## Group Management Endpoints

### Alle Gruppen abrufen

**GET** `/api/groups`

**Verhalten:**
- STUDENT/TEACHER: Nur eigene Gruppen
- PRINCIPAL/ADMIN: Alle Gruppen

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "Klasse 10A",
    "createdAt": "2025-11-17T09:00:00.000Z",
    "updatedAt": "2025-11-17T09:00:00.000Z",
    "_count": {
      "members": 25,
      "entries": 42
    }
  },
  {
    "id": 2,
    "name": "Mathe-AG",
    "createdAt": "2025-11-17T09:05:00.000Z",
    "updatedAt": "2025-11-17T09:05:00.000Z",
    "_count": {
      "members": 12,
      "entries": 8
    }
  }
]
```

---

### Einzelne Gruppe abrufen

**GET** `/api/groups/:id`

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Klasse 10A",
  "createdAt": "2025-11-17T09:00:00.000Z",
  "updatedAt": "2025-11-17T09:00:00.000Z",
  "members": [
    {
      "userId": 5,
      "groupId": 1,
      "addedAt": "2025-11-17T10:00:00.000Z",
      "user": {
        "id": 5,
        "username": "max.mueller",
        "role": "STUDENT"
      }
    }
  ]
}
```

---

### Gruppe erstellen

**POST** `/api/groups`

**Berechtigung:** PRINCIPAL, ADMIN

**Request Body:**
```json
{
  "name": "Klasse 10B"
}
```

**Response:** `201 Created`
```json
{
  "id": 3,
  "name": "Klasse 10B",
  "createdAt": "2025-11-17T12:00:00.000Z",
  "updatedAt": "2025-11-17T12:00:00.000Z"
}
```

---

### Gruppe aktualisieren

**PUT** `/api/groups/:id`

**Berechtigung:** PRINCIPAL, ADMIN

**Request Body:**
```json
{
  "name": "Klasse 10B - Neuer Name"
}
```

**Response:** `200 OK`
```json
{
  "id": 3,
  "name": "Klasse 10B - Neuer Name",
  "createdAt": "2025-11-17T12:00:00.000Z",
  "updatedAt": "2025-11-17T13:00:00.000Z"
}
```

---

### Gruppe löschen

**DELETE** `/api/groups/:id`

**Berechtigung:** PRINCIPAL, ADMIN

**Response:** `200 OK`
```json
{
  "message": "Gruppe erfolgreich gelöscht"
}
```

**Error:** `400 Bad Request`
```json
{
  "error": "Gruppe kann nicht gelöscht werden, da sie Einträge enthält"
}
```

---

### Mitglieder einer Gruppe abrufen

**GET** `/api/groups/:id/members`

**Response:** `200 OK`
```json
[
  {
    "id": 5,
    "username": "max.mueller",
    "role": "STUDENT"
  },
  {
    "id": 8,
    "username": "anna.schmidt",
    "role": "STUDENT"
  }
]
```

---

### Mitglied zu Gruppe hinzufügen

**POST** `/api/groups/:id/members`

**Berechtigung:** PRINCIPAL, ADMIN

**Request Body:**
```json
{
  "userId": 5
}
```

**Response:** `201 Created`
```json
{
  "message": "Benutzer erfolgreich zur Gruppe hinzugefügt"
}
```

---

### Mitglied aus Gruppe entfernen

**DELETE** `/api/groups/:id/members/:userId`

**Berechtigung:** PRINCIPAL, ADMIN

**Response:** `200 OK`
```json
{
  "message": "Benutzer erfolgreich aus der Gruppe entfernt"
}
```

---

## Entry Endpoints

### Einträge für eine Woche abrufen

**GET** `/api/entries/week/:year/:week`

**Beispiel:** `/api/entries/week/2025/12`

**Query Parameters:**
- `groupIds` (optional): Komma-getrennte Liste von Gruppen-IDs

**Beispiel:** `/api/entries/week/2025/12?groupIds=1,3,5`

**Verhalten:**
- STUDENT: Nur eigene Gruppen + public, keine gelöschten Einträge
- TEACHER: Nur eigene Gruppen, inkl. gelöschte Einträge
- PRINCIPAL/ADMIN: Alle Gruppen, inkl. gelöschte Einträge

**Response:** `200 OK`
```json
[
  {
    "id": 42,
    "title": "Mathe Hausaufgaben",
    "description": "Seite 42-45, Aufgaben 1-10",
    "displayDate": "2025-03-17T00:00:00.000Z",
    "type": "HOMEWORK",
    "groupId": 1,
    "createdById": 2,
    "editedById": null,
    "createdAt": "2025-03-15T10:30:00.000Z",
    "updatedAt": "2025-03-15T10:30:00.000Z",
    "isDeleted": false,
    "deletedAt": null,
    "group": {
      "id": 1,
      "name": "Klasse 10A"
    },
    "createdBy": {
      "id": 2,
      "username": "lehrer.schmidt",
      "role": "TEACHER"
    },
    "editedBy": null
  }
]
```

---

### Einzelnen Eintrag abrufen

**GET** `/api/entries/:id`

**Response:** `200 OK`
```json
{
  "id": 42,
  "title": "Mathe Hausaufgaben",
  "description": "Seite 42-45, Aufgaben 1-10",
  "displayDate": "2025-03-17T00:00:00.000Z",
  "type": "HOMEWORK",
  "groupId": 1,
  "createdById": 2,
  "editedById": null,
  "createdAt": "2025-03-15T10:30:00.000Z",
  "updatedAt": "2025-03-15T10:30:00.000Z",
  "isDeleted": false,
  "deletedAt": null,
  "group": {
    "id": 1,
    "name": "Klasse 10A",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "createdBy": {
    "id": 2,
    "username": "lehrer.schmidt",
    "role": "TEACHER"
  },
  "editedBy": null
}
```

---

### Eintrag erstellen

**POST** `/api/entries`

**Request Body:**
```json
{
  "title": "Englisch Test",
  "description": "Kapitel 5-7, Vokabeln lernen",
  "displayDate": "2025-03-20",
  "type": "EXAM",
  "groupId": 1
}
```

**Verfügbare Types:**
- `HOMEWORK` - Hausaufgaben
- `EVENT` - Veranstaltung
- `EXAM` - Prüfung
- `REMINDER` - Erinnerung
- `OTHER` - Sonstiges

**Response:** `201 Created`
```json
{
  "id": 43,
  "title": "Englisch Test",
  "description": "Kapitel 5-7, Vokabeln lernen",
  "displayDate": "2025-03-20T00:00:00.000Z",
  "type": "EXAM",
  "groupId": 1,
  "createdById": 5,
  "editedById": null,
  "createdAt": "2025-03-15T14:00:00.000Z",
  "updatedAt": "2025-03-15T14:00:00.000Z",
  "isDeleted": false,
  "deletedAt": null,
  "group": {
    "id": 1,
    "name": "Klasse 10A",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "createdBy": {
    "id": 5,
    "username": "max.mueller",
    "role": "STUDENT"
  }
}
```

---

### Eintrag bearbeiten

**PUT** `/api/entries/:id`

**Wichtig:** Erstellt einen neuen Eintrag und markiert den alten als gelöscht (Edit-Historie)

**Request Body:** (alle Felder optional)
```json
{
  "title": "Englisch Test - VERSCHOBEN",
  "description": "Kapitel 5-7, Vokabeln lernen. Test wurde verschoben!",
  "displayDate": "2025-03-25",
  "type": "EXAM"
}
```

**Response:** `200 OK`
```json
{
  "id": 44,
  "title": "Englisch Test - VERSCHOBEN",
  "description": "Kapitel 5-7, Vokabeln lernen. Test wurde verschoben!",
  "displayDate": "2025-03-25T00:00:00.000Z",
  "type": "EXAM",
  "groupId": 1,
  "createdById": 5,
  "editedById": 2,
  "createdAt": "2025-03-15T16:00:00.000Z",
  "updatedAt": "2025-03-15T16:00:00.000Z",
  "isDeleted": false,
  "deletedAt": null,
  "group": {
    "id": 1,
    "name": "Klasse 10A",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  },
  "createdBy": {
    "id": 5,
    "username": "max.mueller",
    "role": "STUDENT"
  },
  "editedBy": {
    "id": 2,
    "username": "lehrer.schmidt",
    "role": "TEACHER"
  }
}
```

---

### Eintrag löschen

**DELETE** `/api/entries/:id`

**Verhalten:**
- STUDENT/TEACHER/PRINCIPAL: Soft Delete (isDeleted = true)
- ADMIN: Permanentes Löschen

**Response:** `200 OK`
```json
{
  "message": "Eintrag gelöscht"
}
```

---

### Gelöschte Einträge abrufen

**GET** `/api/entries/deleted`

**Berechtigung:** TEACHER, PRINCIPAL, ADMIN

**Response:** `200 OK`
```json
[
  {
    "id": 43,
    "title": "Englisch Test",
    "description": "Kapitel 5-7, Vokabeln lernen",
    "displayDate": "2025-03-20T00:00:00.000Z",
    "type": "EXAM",
    "groupId": 1,
    "createdById": 5,
    "editedById": null,
    "createdAt": "2025-03-15T14:00:00.000Z",
    "updatedAt": "2025-03-15T16:00:00.000Z",
    "isDeleted": true,
    "deletedAt": "2025-03-15T16:00:00.000Z",
    "group": {
      "id": 1,
      "name": "Klasse 10A",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    },
    "createdBy": {
      "id": 5,
      "username": "max.mueller",
      "role": "STUDENT"
    },
    "editedBy": null
  }
]
```

---

## Fehler-Codes

### 400 Bad Request
Ungültige Eingabedaten oder Validierungsfehler

### 401 Unauthorized
Nicht authentifiziert oder ungültiger Token

### 403 Forbidden
Nicht berechtigt für diese Aktion

### 404 Not Found
Ressource nicht gefunden

### 500 Internal Server Error
Serverfehler (sollte nicht passieren, bitte melden!)

---

## Beispiel: Kompletter Workflow (JavaScript/Fetch)

```javascript
// 1. Login
const loginResponse = await fetch('https://api.domain.de/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'max.mueller',
    password: 'passwort123'
  })
});

const { token, user } = await loginResponse.json();

// 2. Token speichern (z.B. in localStorage)
localStorage.setItem('token', token);

// 3. Gruppen abrufen
const groupsResponse = await fetch('https://api.domain.de/api/groups', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const groups = await groupsResponse.json();

// 4. Einträge für Woche 12 von 2025 abrufen
const entriesResponse = await fetch(
  `https://api.domain.de/api/entries/week/2025/12?groupIds=${groups.map(g => g.id).join(',')}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const entries = await entriesResponse.json();

// 5. Neuen Eintrag erstellen
const newEntryResponse = await fetch('https://api.domain.de/api/entries', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Physik Hausaufgaben',
    description: 'Kapitel 8 durchlesen',
    displayDate: '2025-03-18',
    type: 'HOMEWORK',
    groupId: groups[0].id
  })
});

const newEntry = await newEntryResponse.json();
```

---

## Rate Limiting

Aktuell gibt es kein Rate Limiting. Bei hoher Last kann dies in Zukunft hinzugefügt werden.

## Support

Bei Fragen zur API, erstelle ein Issue im GitHub Repository.
