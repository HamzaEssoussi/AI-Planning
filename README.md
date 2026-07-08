<div align="center">

# AI Planning

### Project Planning

[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Ollama](https://img.shields.io/badge/Ollama-000000?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.ai/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![LangChain](https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white)](https://www.langchain.com/)

**AI Planning** is a local project planning simulator combining a FastAPI backend, a React/TypeScript wizard interface, and local services such as Ollama and ChromaDB. It helps capture project information, estimate effort by module and phase, generate a WBS-style planning output, and export the results to XML, Excel, or PDF.

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Problem Statement](#-problem-statement)
- [Features](#-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Usage](#-usage)
- [API Endpoints](#-api-endpoints)
- [Project Structure](#-project-structure)
- [Useful Commands](#-useful-commands)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)
- [Contact](#-contact)

---

## 🎯 Overview

**AI Planning** is a local estimation and planning application for project pre-sales workflows. It provides a guided wizard in React/TypeScript to collect project data, a FastAPI backend to calculate estimations and planning data, and export capabilities for XML, Excel, and PDF.

This project runs locally with Docker and includes Ollama for local AI inference, ChromaDB for vector-oriented storage, PostgreSQL for structured persistence, and a React frontend for interactive project planning.

---

## ⚠️ Problem Statement

Project planning and pre-sales estimation are often manual and repetitive:

- Collecting project information across multiple steps
- Estimating module-level effort and complexity
- Mapping resources and rates to estimated effort
- Generating exportable project plans

**AI Planning simplifies this workflow** by providing a guided wizard-style UI, backend estimation engine, and XML export for project delivery.

---

## ✨ Features

- **Wizard-based React/TypeScript frontend** with Vite and Material UI
- **Interactive WBS-style planning view** generated from estimation and planning data
- **Step-by-step project input** for project info, segments, modules, estimates, resources, and planning parameters
- **Backend estimation engine** using configurable complexity coefficients, phase distribution, and role allocation
- **Multi-format exports** to MS Project XML, Excel, and PDF
- **REST API** powered by FastAPI with Swagger documentation
- **Local AI runtime** via Ollama and optional model recommendations
- **ChromaDB service** for storage and retrieval workflows
- **PostgreSQL database** for wizard state and structured backend persistence
- **Docker Compose orchestration** for local development

---

## 🏗️ Architecture

```
┌─────────────────────────────┐       ┌────────────────────────┐
│   React/TypeScript UI       │       │      FastAPI Backend   │
│  frontend/src/components    │ <-->  │      backend/main.py   │
│  (Vite + Material-UI)       │       │                        │
└─────────────────────────────┘       └────────────────────────┘
               │                           │
               │ HTTP (REST)               │
               ▼                           ▼
      ┌───────────────────┐       ┌─────────────────────┐
      │    Ollama AI      │       │    ChromaDB         │
      │   ollama:11434    │       │   chromadb:8001     │
      └───────────────────┘       └─────────────────────┘
```

### Data Flow

1. The user fills project details in the React wizard.
2. The frontend sends the wizard state to the FastAPI backend.
3. The backend stores progress in PostgreSQL and calculates effort, costs, and planning data.
4. The frontend displays the planning result and WBS-style tasks.
5. The user exports the result as XML, Excel, or PDF.

---

## 🛠️ Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| **Frontend** | React 18 + TypeScript | UI in `frontend/src/` with Vite |
| **UI Framework** | Material UI (MUI) | Wizard UI, forms, charts, dialogs |
| **Build Tool** | Vite | `frontend/vite.config.ts` |
| **Backend** | FastAPI | API entrypoint in `backend/main.py` |
| **AI Runtime** | Ollama | Local model runtime for AI-related workflows |
| **Embeddings / RAG** | ChromaDB | Additional storage/retrieval support |
| **Database** | PostgreSQL | Wizard persistence and backend state storage |
| **Export Formats** | XML, Excel, PDF | Implemented in `backend/routers/export.py` |
| **Estimation Engine** | Python | Logic in `backend/services/estimation_engine.py` |
| **Data Models** | Pydantic + SQLAlchemy | Schemas in `backend/models/` and ORM in `backend/models/domain.py` |
| **Containerization** | Docker Compose | Configuration in `docker-compose.yml` |

---

## 📋 Prerequisites

- Docker Desktop installed and running
- Docker Compose support enabled
- Git installed (optional)

---

## 🚀 Quick Start

### Using Docker Compose

```bash

docker compose up -d
```

Then open:

- **React Frontend**: `http://localhost:5173` (Vite dev server)
- **FastAPI Docs**: `http://localhost:8000/docs` (Swagger UI)
- **Health Check**: `http://localhost:8000/health`

### Local Development (without Docker)

```bash
# Backend setup
cd backend
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend setup (in another terminal)
cd frontend
npm install
npm run dev
```

---

## 🎮 Usage

### PostgreSQL

The project includes a PostgreSQL 15 service in Docker Compose for backend data persistence. When you start the stack with Docker, PostgreSQL is automatically launched and the backend connects to it through the `DATABASE_URL` environment variable.

Default connection details:

- Host: `localhost`
- Port: `5432`
- Database: `aiplanning`
- User: `admin`
- Password: `admin`

You can inspect or query the database with:

```bash
docker compose ps postgres
docker exec -it aiplanning_postgres psql -U admin -d aiplanning
```

### Frontend

1. Open `http://localhost:5173` (or `http://localhost:8001` for production)
2. Fill project information in the wizard
3. Select business segments and modules
4. Enter module estimation details
5. Define resources and allocations
6. Review the generated WBS (Work Breakdown Structure) diagram
7. Export project as XML, Excel, or PDF

### Backend API

The backend exposes REST endpoints for wizard persistence, estimation, planning, and exports:

- `POST /api/wizard/step/{step}` — save wizard step data
- `GET /api/wizard/state` — retrieve the current wizard state
- `GET /api/wizard/debug/{session_id}` — inspect stored wizard data for debugging
- `POST /api/wizard/reset` — reset wizard state
- `POST /api/estimation/calculate` — calculate estimation results and planning data
- `POST /api/export/xml` — generate MS Project XML
- `POST /api/export/excel` — generate Excel export
- `POST /api/export/pdf` — generate PDF export

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Root health check |
| GET | `/health` | Service status |
| POST | `/api/wizard/step/{step}` | Save wizard step data |
| GET | `/api/wizard/state` | Retrieve stored wizard state |
| GET | `/api/wizard/debug/{session_id}` | Inspect stored wizard state |
| POST | `/api/wizard/reset` | Reset wizard session |
| POST | `/api/estimation/calculate` | Calculate estimation and planning result |
| POST | `/api/export/xml` | Generate MS Project XML |
| POST | `/api/export/excel` | Generate Excel export |
| POST | `/api/export/pdf` | Generate PDF export |

### Example Request — Estimation

```bash
curl -X POST http://localhost:8000/api/estimation/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "current_step": 5,
    "estimations": [
      {
        "module": "kyc_boarding",
        "components": [
          {"component": "workflow", "quantity": 2, "complexity": "medium"},
          {"component": "document", "quantity": 1, "complexity": "low"}
        ]
      }
    ],
    "resources": [
      {"role": "project_manager", "count": 1, "daily_rate": 800.0, "allocation": 0.8, "profile": "senior"}
    ]
  }'
```

---

## 📁 Project Structure

```
AIPlanning/
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── constants.py
│   │   └── database.py
│   ├── models/
│   │   ├── domain.py
│   │   └── schemas.py
│   ├── routers/
│   │   ├── documents.py
│   │   ├── estimation.py
│   │   ├── export.py
│   │   ├── planning.py
│   │   └── wizard.py
│   ├── services/
│   │   ├── estimation_engine.py
│   │   ├── excel_generator.py
│   │   ├── pdf_generator.py
│   │   ├── xml_generator.py
│   │   └── __init__.py
│   ├── templates/
│   ├── tests/
│   └── utils/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── api/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── assets/
│   └── public/
├── data/
│   ├── chroma/
│   └── ollama/
├── scripts/
├── docker-compose.yml
├── README.md
└── .env.example
```

---

## 🛠️ Useful Commands

### Docker Compose

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# Rebuild images
docker compose build --no-cache

# View logs (all services)
docker compose logs -f

# View backend logs
docker compose logs backend -f

# View frontend logs
docker compose logs frontend -f
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (Vite)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Development

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/Scripts/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload --port 8000

# Run tests
pytest tests/
```

### Database

```bash
# Check running containers
docker compose ps

# Connect to PostgreSQL
docker exec -it aiplanning_postgres psql -U admin -d aiplanning
```

---

## 🔧 Troubleshooting

### 1. Service startup issues

```bash
# Check logs for all services
docker compose logs -f

# Check specific service logs
docker compose logs backend -f
docker compose logs frontend -f
docker compose logs ollama -f
docker compose logs chromadb -f
```

### 2. Frontend cannot reach backend

- Verify the `API_URL` in `frontend/src/api/client.ts` matches your backend URL
- Ensure backend is running on port `8000`
- Check CORS configuration in `backend/main.py`

### 3. Ollama model or container issues

- Confirm Ollama container is healthy: `docker compose ps`
- Verify Ollama is reachable: `curl http://localhost:11434`
- Check available models: `ollama list` (inside Ollama container)

### 4. Frontend build errors

```bash
cd frontend

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite

# Rebuild
npm run build
```

### 5. Port conflicts

If ports 5173 (Vite), 8000 (FastAPI), or 8001 (production frontend) are in use:

```bash
# Find process using port
lsof -i :5173  # macOS/Linux
netstat -ano | findstr :5173  # Windows

# Kill process or change port in docker-compose.yml
```

---

## 🗺️ Roadmap

- [ ] Implement advanced WBS editing and drag-drop hierarchy
- [ ] Add document upload and indexing endpoints
- [ ] Expand export formats (Excel templates, Gantt charts)
- [ ] Implement full RAG document retrieval service
- [ ] Add authentication and session persistence
- [ ] Create reusable project templates
- [ ] Build advanced filtering and search for project tasks
- [ ] Develop real-time collaboration features
- [ ] Add AI-powered project recommendations

---

5. Open a pull request

### Code standards

**Python (Backend)**
- Use PEP 8 for code style
- Type hints for all functions
- Docstrings for public methods
- Keep functions small and focused

**TypeScript/React (Frontend)**
- Use ESLint and Prettier for formatting
- Component-based architecture
- Prop validation with TypeScript
- Add tests for new components


## 📌 License

This repository does not currently include a `LICENSE` file. Add one if you want to apply an open-source license.

---

## 📞 Contact & Support

- **Project Owner**: Hamza Essoussi
- **Email**: hamza.essoussi@etudiant-enit.utm.tn
- **Issues**: Feel free to open issues for bugs, feature requests, or discussions

---

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)
- [Vite Documentation](https://vitejs.dev/)
- [Docker Documentation](https://docs.docker.com/)
- [Ollama Documentation](https://github.com/ollama/ollama)

---

<div align="center">

*AI Planning — Intelligent Project Planning & WBS Simulation*

**Made for better project planning**

</div>
