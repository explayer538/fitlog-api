# FitLog

FitLog is a simple full-stack fitness tracker for recording runs, lifts, rides, and swims. It includes a React dashboard, a Django REST API, JWT authentication, per-user activity data, and automatically calculated fitness statistics.

The default configuration is designed to run entirely on one laptop. It uses SQLite and executes statistic updates immediately, so Docker, PostgreSQL, Redis, and a separate Celery worker are optional.

## Features

- Register, sign in, refresh an expired session, and sign out
- Log, edit, and delete workouts
- Track total workouts, total distance, weekly distance, and current streak
- Keep every user's activities private from other users
- Enter run, ride, and lift distances in kilometers
- Enter and display swim distances in meters while storing kilometers consistently in the API
- Use the responsive bubble-style dashboard on laptop and mobile screens
- See useful loading, empty, success, validation, and connection states

## Project Structure

```text
fitlog-api/
├── activities/           Activity models, API views, statistics task, and tests
├── fitlog/               Django settings, root URLs, and Celery setup
├── users/                Registration endpoint and authentication tests
├── frontend/
│   ├── src/App.jsx       React screens, forms, dashboard, and workout controls
│   ├── src/api.js        API requests, JWT storage, and automatic token refresh
│   ├── src/App.css       Bubble-style responsive interface
│   └── vite.config.js    Local proxy from React to Django
├── .env.example          Safe local configuration template
├── .gitignore            Secret and generated-file protection
├── docker-compose.yml    Optional PostgreSQL and Redis services
├── manage.py             Django command entry point
└── requirements.txt      Python dependencies
```

## How It Works

### Authentication

1. The React app sends registration details to `POST /api/auth/register/`.
2. Login uses `POST /api/auth/login/` and receives JWT access and refresh tokens.
3. The frontend attaches the access token to protected API requests.
4. If the access token expires, `src/api.js` requests a new one from `/api/auth/token/refresh/` and retries the original request once.
5. Logging out removes the local tokens.

Tokens are stored in browser local storage for this laptop-only version. A public deployment should move refresh tokens to secure HTTP-only cookies.

### Workout and statistics flow

1. The user creates, edits, or deletes a workout in React.
2. Django validates the input and limits the database query to the signed-in user.
3. `recalculate_user_stats` updates the user's totals after every change.
4. The React dashboard reloads the activity list and statistics.

Local mode sets `CELERY_TASK_ALWAYS_EAGER=True`, so the stats task runs immediately without Redis. For a larger deployment, set it to `False`, start Redis, and run a Celery worker.

### Distance units

The database and API always store distance in kilometers. Run, ride, and lift distances are entered in kilometers. Swim distance is entered and displayed in meters; the frontend converts it to kilometers before sending it to the API and converts it back when displaying or editing a swim.

## Run Locally

### Requirements

- Python 3.12 or newer
- Node.js 20.19 or newer
- Git

### 1. Prepare the Django API

```bash
git clone https://github.com/explayer538/fitlog-api.git
cd fitlog-api
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py runserver
```

Before starting Django, replace the placeholder `SECRET_KEY` in `.env` with a long random value. `.env` is ignored by Git and must never be committed.

The API runs at `http://127.0.0.1:8000`.

### 2. Start React

Open a second terminal:

```bash
cd fitlog-api/frontend
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Vite forwards `/api` requests to Django, so local CORS configuration is unnecessary.

## Configuration

Copy `.env.example` to `.env`. The local defaults are:

| Setting | Purpose | Local value |
|---|---|---|
| `SECRET_KEY` | Django signing secret | Replace the placeholder |
| `DEBUG` | Django development mode | `True` |
| `DB_ENGINE` | Selects SQLite or PostgreSQL | `sqlite` |
| `CELERY_TASK_ALWAYS_EAGER` | Runs stat tasks without Redis | `True` |

The PostgreSQL settings below the local values are only read when `DB_ENGINE=postgres`.

## API Reference

| Method | Endpoint | Authentication | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register/` | No | Create an account |
| `POST` | `/api/auth/login/` | No | Receive access and refresh tokens |
| `POST` | `/api/auth/token/refresh/` | Refresh token | Renew an access token |
| `GET` | `/api/activities/` | JWT | List the current user's workouts |
| `POST` | `/api/activities/` | JWT | Create a workout |
| `GET` | `/api/activities/{id}/` | JWT | Retrieve one workout |
| `PUT` | `/api/activities/{id}/` | JWT | Replace one workout |
| `DELETE` | `/api/activities/{id}/` | JWT | Delete one workout |
| `GET` | `/api/activities/stats/` | JWT | Retrieve calculated statistics |

### Activity fields

| Field | Type | Notes |
|---|---|---|
| `activity_type` | String | `run`, `lift`, `ride`, or `swim` |
| `duration_mins` | Positive integer | Must be at least 1 |
| `distance_km` | Number or null | Must not be negative |
| `notes` | String or null | Optional |
| `logged_at` | Datetime | Set by the server |

## Tests and Code Checks

Run backend tests from the project root:

```bash
source .venv/bin/activate
python manage.py test
python manage.py check
```

Run frontend checks from `frontend/`:

```bash
npm run lint
npm run build
```

The backend tests cover registration, login, token refresh, activity validation, full activity CRUD, statistics recalculation, and user data isolation.

## Optional PostgreSQL and Redis Mode

The included `docker-compose.yml` starts PostgreSQL and Redis:

```bash
docker compose up -d
```

Then set `DB_ENGINE=postgres` and `CELERY_TASK_ALWAYS_EAGER=False` in `.env`, run migrations, and start a worker in another terminal:

```bash
celery -A fitlog worker --loglevel=info
```

## Security and Repository Hygiene

- Never commit `.env`, access tokens, passwords, database files, logs, virtual environments, or dependency folders.
- `.gitignore` excludes these files, and `.env.example` contains placeholders only.
- Rotate any credential immediately if it is accidentally published.
- The repository does not track the local SQLite database or runtime logs.
- Keep `DEBUG=False`, use a unique production secret, and review cookie/token storage before any public deployment.

## Troubleshooting

- **The page opens but login fails:** Confirm Django is running at `http://127.0.0.1:8000`.
- **Django reports unapplied migrations:** Run `python manage.py migrate`.
- **Python rejects the Django version:** Use Python 3.12 or newer.
- **The React command is missing:** Run `npm install` inside `frontend/`.
- **Stats do not change in Redis mode:** Confirm Redis and the Celery worker are running, or switch `CELERY_TASK_ALWAYS_EAGER=True` for local use.
