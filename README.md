# FitLog API

A production-style fitness activity tracking REST API built with Django, PostgreSQL, Celery, and Redis. Users can register, log workouts, and have their stats automatically computed in the background using async task processing.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Django + Django REST Framework |
| Database | PostgreSQL |
| Auth | JWT (SimpleJWT) |
| Background Tasks | Celery |
| Message Broker | Redis |
| Containerization | Docker Compose |

## Features

- JWT-authenticated REST API endpoints
- Full CRUD for fitness activities (runs, lifts, rides, swims)
- Automatic background stat computation via Celery after every activity log
- Per-user data isolation — users can only access their own data
- Persistent PostgreSQL storage with normalized relational models
- Redis as the Celery message broker

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register/` | None | Create account |
| POST | `/api/auth/login/` | None | Get JWT token |
| GET | `/api/activities/` | JWT | List your activities |
| POST | `/api/activities/` | JWT | Log a new activity |
| GET | `/api/activities/{id}/` | JWT | Get one activity |
| PUT | `/api/activities/{id}/` | JWT | Update an activity |
| DELETE | `/api/activities/{id}/` | JWT | Delete an activity |
| GET | `/api/activities/stats/` | JWT | View your computed stats |

## Local Setup

### Prerequisites
- Python 3.10+
- Docker Desktop

### Steps

**1. Clone the repository:**
```bash
git clone https://github.com/YOUR_USERNAME/fitlog-api.git
cd fitlog-api
```

**2. Create and activate virtual environment:**
```bash
python3 -m venv .venv
source .venv/bin/activate
```

**3. Install dependencies:**
```bash
pip install -r requirements.txt
```

**4. Create a `.env` file in the root directory:**
```
SECRET_KEY=your-secret-key-here
DEBUG=True
DB_NAME=fitlog_db
DB_USER=fitlog_user
DB_PASSWORD=fitlog123
DB_HOST=localhost
DB_PORT=5432
```

**5. Start PostgreSQL and Redis with Docker:**
```bash
docker compose up -d
```

**6. Run migrations:**
```bash
python manage.py migrate
```

**7. Start the Django server:**
```bash
python manage.py runserver
```

**8. In a separate terminal, start the Celery worker:**
```bash
celery -A fitlog worker --loglevel=info
```

## How the Background Task Works

Every time a user logs an activity, `recalculate_user_stats.delay(user_id)` is called. This drops a task into the Redis queue and returns immediately — the user gets an instant response. The Celery worker picks up the task and recalculates:

- Total activities logged
- Total distance across all activities
- Weekly distance (last 7 days)
- Current consecutive day streak

Results are stored in the `UserStats` table and accessible via `/api/activities/stats/`.

## Example Usage

**Register:**
```bash
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username": "athlete1", "email": "athlete@example.com", "password": "securepass123"}'
```

**Login and get token:**
```bash
curl -X POST http://127.0.0.1:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "athlete1", "password": "securepass123"}'
```

**Log a workout:**
```bash
curl -X POST http://127.0.0.1:8000/api/activities/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"activity_type": "run", "duration_mins": 30, "distance_km": 5.0, "notes": "Morning run"}'
```

**Check your stats:**
```bash
curl http://127.0.0.1:8000/api/activities/stats/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```
