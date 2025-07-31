# Topluluk

Topluluk is a full-stack web application featuring a Django REST API backend and a React frontend. The project is containerized with Docker Compose for easy setup and deployment.

---

## Project Structure

```
Topluluk/
├── topluluk-backend/       # Django backend
├── topluluk-frontend/      # React frontend
├── envs/                   # .env files (excluded from Git)
├── pg_data/                # Postgres data volume (ignored)
├── docker-compose.yml      # Docker Compose setup
└── README.md
```

---

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Halil-pgh/Topluluk-all.git
cd Topluluk-all
```

---

### 2. Create `.env` Files

Create the following files based on the provided `.env.example` templates:

```bash
cp topluluk-backend/backend.env.example topluluk-backend/backend.env
cp envs/db.env.example envs/db.env
```

Update them with your local configuration (DB credentials, Django secret, etc.)

---

### 3. Build and Start the App

Run the following to build and run the containers:

```bash
docker compose up --build
```

This will:
- Start the Postgres database
- Build and run the Django backend
- Build and serve the React frontend

---

### 4. Run Migrations

After your containers are up:

```bash
docker exec topluluk_app python manage.py migrate
```
This command initializes the database schema and is required for the application to function properly, even if the containers are already running.

---

## 🧹 Cleanup

Stop and remove all containers:

```bash
docker compose down
```

Remove volumes too (including DB data):

```bash
docker compose down -v
```

---

## 🧠 Credits

Built with:
- Django REST Framework
- React & Vite
- PostgreSQL
- Docker Compose

---
