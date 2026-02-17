# 📸 AI Image Tagger & Moodboarder

Dit project is een webapplicatie die automatisch afbeeldingen tagt met AI en gebruikers in staat stelt om handmatig of via AI collecties en moodboards te maken.

## 🏗️ Project Structuur

- **frontend/**: Next.js (React) applicatie met Tailwind CSS.
- **backend/**: FastAPI (Python) met SQLModel (SQLite) en AI-integratie.

## 🚀 Aan de slag

### 1. Backend opstarten (Python/FastAPI)

Open een terminal en navigeer naar de backend map:

```bash
cd backend
```

Virtuele omgeving activeren:

```bash
source .venv/bin/activate
```

Dependencies installeren (indien nodig):

```bash
pip install -r requirements.txt
```

De server starten:

```bash
uvicorn main:app --reload
```

De backend draait nu op: [http://localhost:8000](http://localhost:8000)

API Documentatie (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)

### 2. Frontend opstarten (Next.js)

Open een nieuwe terminal en navigeer naar de frontend map:

```bash
cd frontend
```

Dependencies installeren:

```bash
npm install
```

De server starten:

```bash
npm run dev
```

De frontend draait nu op: [http://localhost:3000](http://localhost:3000)

## 🛠️ Handige Commando's

| Actie | Commando | Map |
|-------|----------|-----|
| Nieuwe Python package | `pip install <package-naam>` | /backend |
| Requirements updaten | `pip freeze > requirements.txt` | /backend |
| Nieuwe Frontend package | `npm install <package-naam>` | /frontend |
| Database checken | Gebruik de /docs pagina | /backend |

