# Moodle MCP Server - Demo Minim

## 📋 Scop

Acest document oferă un ghid rapid pentru testarea Moodle MCP Server în:
- **Cursor IDE** (local development)
- **Obot** (containerized deployment)

---

## 🚀 Testare în Cursor

### 1. Configurare

#### 1.1 Verifică build-ul
```bash
cd /Users/mihai/Documents/tech_workspace/clienti/skylite-tek/ai-workspace/mcp/moodle/moodle-mcp-server
npm run build
```

#### 1.2 Configurează Cursor MCP

**IMPORTANT:** Dacă `~/.cursor/mcp.json` nu există, creează-l:

```bash
mkdir -p ~/.cursor
touch ~/.cursor/mcp.json
```

Apoi editează `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "moodle-mcp-server": {
      "command": "/usr/local/bin/node",
      "args": [
        "/Users/mihai/Documents/tech_workspace/clienti/skylite-tek/ai-workspace/mcp/moodle/moodle-mcp-server/build/index.js"
      ],
      "env": {
        "MOODLE_API_URL": "https://platforma.scoalainformala.ro/webservice/rest/server.php",
        "MOODLE_API_TOKEN": "2d00b9356b469277f74d9631af0e4a4a",
        "MOODLE_COURSE_ID": "1315"
      },
      "disabled": false,
      "autoApprove": [
        "get_courses",
        "get_courses_by_field",
        "get_course_statistics",
        "get_course_contents",
        "list_students",
        "get_assignments",
        "get_quizzes"
      ]
    }
  }
}
```

#### 1.3 Restart Cursor

După configurare, repornește Cursor pentru a încărca MCP server-ul.

### 2. Teste Demo în Cursor

**IMPORTANT:** După restart, tool-urile Moodle MCP vor fi disponibile în chat-ul Cursor. Poți testa direct întrebând:

#### Test 1: Listă cursuri (Admin)
În chat-ul Cursor, întreabă:
```
Folosește tool-ul get_courses pentru a lista toate cursurile disponibile pe platformă.
```

#### Test 1b: Quiz-uri pentru curs specific
În chat-ul Cursor, întreabă:
```
Folosește tool-ul get_quizzes din Moodle MCP pentru cursul 1301 și spune-mi numele quiz-urilor.
```

**Așteptat:**
- Listă cu toate cursurile din Moodle
- Informații: ID, nume, categorie, vizibilitate

#### Test 2: Statistici curs specific
```
Folosește get_course_statistics cu courseId=1315 pentru a obține statistici despre cursul DevOps.
```

**Așteptat:**
- Statistici de bază (total cursuri, active/inactive)
- Statistici de înscriere (studenți, profesori)
- Statistici de activități (sections, assignments, quizzes)
- Statistici de completare (dacă disponibile)

#### Test 3: Conținut curs
```
Folosește get_course_contents cu courseId=1315 pentru a vedea structura completă a cursului DevOps.
```

**Așteptat:**
- Secțiuni organizate
- Module și resurse
- Activități (assignments, quizzes, forums)

#### Test 4: Studenți înscriși
```
Folosește list_students cu courseId=1315 pentru a vedea lista de studenți înscriși în cursul DevOps.
```

**Așteptat:**
- Listă cu ID, nume, email
- Timpul ultimei accesări

#### Test 5: Teme disponibile
```
Folosește get_assignments cu courseId=1315 pentru a vedea toate temele din cursul DevOps.
```

**Așteptat:**
- Listă de assignments
- Informații: ID, nume, dată limită, notă maximă

---

## 🐳 Testare în Obot

### 1. Configurare Catalog

#### 1.1 Verifică `moodle.yaml`

Fișierul `moodle.yaml` este deja configurat cu:
- Runtime: `containerized`
- Image: `ghcr.io/mihai-satmarean/moodle-mcp-server:latest`
- Port: `3000`
- Path: `/mcp`

#### 1.2 Adaugă în Obot Catalog

În Obot, adaugă catalog entry folosind `moodle.yaml`:

```yaml
# moodle.yaml este deja configurat corect
# Runtime: containerized
# Image: ghcr.io/mihai-satmarean/moodle-mcp-server:latest
```

### 2. Configurare Environment Variables în Obot

Când adaugi MCP server-ul în Obot, setează:

**Required:**
- `MOODLE_API_URL`: `https://platforma.scoalainformala.ro/webservice/rest/server.php`
- `MOODLE_API_TOKEN`: `2d00b9356b469277f74d9631af0e4a4a`

**Optional:**
- `MOODLE_COURSE_ID`: `1315` (pentru operațiuni specifice cursului)

### 3. Teste Demo în Obot

#### Test 1: Verificare conectivitate
```
Testează dacă MCP server-ul este accesibil și listă tool-urile disponibile.
```

**Așteptat:**
- Server-ul răspunde
- Listă de tool-uri disponibile:
  - `get_courses`
  - `get_course_statistics`
  - `get_course_contents`
  - `list_students`
  - `get_assignments`
  - `get_quizzes`
  - etc.

#### Test 2: Listă cursuri
```
Folosește get_courses pentru a lista toate cursurile.
```

#### Test 3: Statistici curs DevOps
```
Folosește get_course_statistics cu courseId=1315.
```

#### Test 4: Conținut curs
```
Folosește get_course_contents cu courseId=1315.
```

---

## ✅ Checklist Testare

### Cursor
- [ ] Build reușit (`npm run build`)
- [ ] Configurare `~/.cursor/mcp.json` completă
- [ ] Cursor repornit
- [ ] Tool-uri vizibile în Cursor
- [ ] `get_courses` funcționează
- [ ] `get_course_statistics` funcționează pentru curs 1315
- [ ] `get_course_contents` funcționează pentru curs 1315
- [ ] `list_students` funcționează pentru curs 1315
- [ ] `get_assignments` funcționează pentru curs 1315

### Obot
- [ ] `moodle.yaml` validat
- [ ] Container image disponibil (`ghcr.io/mihai-satmarean/moodle-mcp-server:latest`)
- [ ] MCP server adăugat în Obot catalog
- [ ] Environment variables configurate
- [ ] Server accesibil în Obot
- [ ] Tool-uri disponibile în Obot
- [ ] `get_courses` funcționează
- [ ] `get_course_statistics` funcționează
- [ ] `get_course_contents` funcționează

---

## 🔧 Troubleshooting

### Problemă: "MOODLE_API_URL environment variable is required"
**Soluție:** Verifică că environment variables sunt setate corect în configurație.

### Problemă: "Cannot connect to Moodle API"
**Soluție:** 
- Verifică URL-ul API-ului
- Verifică token-ul API
- Verifică conectivitatea la Moodle

### Problemă: "Course not found"
**Soluție:** 
- Verifică că `MOODLE_COURSE_ID` este setat corect
- Verifică că token-ul are permisiuni pentru cursul respectiv

### Problemă: Tool-uri nu apar în Cursor/Obot
**Soluție:**
- Repornește Cursor/Obot
- Verifică log-urile pentru erori
- Verifică că build-ul este actualizat

---

## 📊 Exemple de Răspunsuri Așteptate

### `get_courses` (exemplu)
```json
{
  "courses": [
    {
      "id": 1315,
      "shortname": "DevOps",
      "fullname": "DevOps Course",
      "category": 1,
      "visible": 1
    }
  ],
  "total": 1
}
```

### `get_course_statistics` (exemplu)
```json
{
  "basic": {
    "totalCourses": 1,
    "activeCourses": 1,
    "inactiveCourses": 0
  },
  "enrollment": {
    "totalEnrolled": 25,
    "students": 23,
    "teachers": 2
  },
  "activity": {
    "totalSections": 5,
    "totalActivities": 12,
    "assignments": 3,
    "quizzes": 2
  }
}
```

---

## 📝 Note

- **Curs de test:** ID 1315 (DevOps)
- **Platformă:** `https://platforma.scoalainformala.ro`
- **Token:** Configurat în environment variables
- **Build path:** `/Users/mihai/Documents/tech_workspace/clienti/skylite-tek/ai-workspace/mcp/moodle/moodle-mcp-server/build/index.js`

---

## 🔗 Referințe

- [README.md](README.md) - Documentație completă
- [moodle.yaml](moodle.yaml) - Configurare Obot catalog
- [cursor-mcp-config.json](cursor-mcp-config.json) - Configurare Cursor exemplu
