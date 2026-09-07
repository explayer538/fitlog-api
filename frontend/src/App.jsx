import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity as ActivityIcon,
  ArrowRight,
  Bike,
  CalendarDays,
  Dumbbell,
  Flame,
  Footprints,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Route,
  Sparkles,
  Trash2,
  Waves,
  X,
} from 'lucide-react'
import { apiFetch, clearSession, getUsername, hasSession, register, signIn } from './api'
import './App.css'

const EMPTY_STATS = {
  total_activities: 0,
  total_distance: 0,
  weekly_distance: 0,
  current_streak: 0,
}

const EMPTY_ACTIVITY = {
  activity_type: 'run',
  duration_mins: '',
  distance_km: '',
  notes: '',
}

const ACTIVITY_DETAILS = {
  run: { label: 'Run', icon: Footprints, color: 'mint' },
  lift: { label: 'Lift', icon: Dumbbell, color: 'peach' },
  ride: { label: 'Ride', icon: Bike, color: 'lavender' },
  swim: { label: 'Swim', icon: Waves, color: 'blue' },
}

function formatNumber(value) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 }).format(Number(value) || 0)
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))
}

function getDistanceUnit(activityType) {
  return activityType === 'swim' ? 'm' : 'km'
}

function distanceForForm(activityType, distanceKm) {
  if (distanceKm == null) return ''
  return activityType === 'swim' ? Number(distanceKm) * 1000 : distanceKm
}

function distanceForApi(activityType, distance) {
  if (distance === '') return null
  return activityType === 'swim' ? Number(distance) / 1000 : Number(distance)
}

function formatActivityDistance(activity) {
  const value = distanceForForm(activity.activity_type, activity.distance_km)
  return `${formatNumber(value)} ${getDistanceUnit(activity.activity_type)}`
}

function LoadingScreen() {
  return (
    <main className="loading-screen">
      <div className="brand-mark"><Dumbbell size={27} /></div>
      <RefreshCw className="spin" size={22} aria-hidden="true" />
      <span>Opening your FitLog…</span>
    </main>
  )
}

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const username = mode === 'register' ? await register(form) : await signIn(form.username, form.password)
      onAuthenticated(username)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  function switchMode() {
    setMode((current) => current === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
    <main className="auth-shell">
      <section className="welcome-panel">
        <div className="brand-mark" aria-hidden="true"><Dumbbell size={28} strokeWidth={2.4} /></div>
        <p className="eyebrow">Your movement, made visible</p>
        <h1>Small workouts.<br />Big momentum.</h1>
        <p className="welcome-copy">Log what you did, watch your streak grow, and keep moving forward.</p>
        <div className="bubble bubble-one" />
        <div className="bubble bubble-two" />
        <div className="bubble bubble-three" />
      </section>

      <section className="auth-panel" aria-labelledby="auth-heading">
        <div className="auth-card">
          <div className="mobile-brand">
            <div className="brand-mark small"><Dumbbell size={21} /></div>
            <span>FitLog</span>
          </div>
          <p className="eyebrow">{mode === 'login' ? 'Welcome back' : 'Start your streak'}</p>
          <h2 id="auth-heading">{mode === 'login' ? 'Sign in to FitLog' : 'Create your account'}</h2>
          <p className="muted">{mode === 'login' ? 'Pick up where you left off.' : 'A simpler way to keep moving.'}</p>

          <form onSubmit={handleSubmit}>
            <label htmlFor="username">Username</label>
            <input id="username" name="username" required autoComplete="username" value={form.username} onChange={updateField} placeholder="Your username" />
            {mode === 'register' && (
              <>
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" required autoComplete="email" value={form.email} onChange={updateField} placeholder="you@example.com" />
              </>
            )}
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" minLength={8} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={updateField} placeholder="At least 8 characters" />

            {error && <div className="form-message error-message" role="alert">{error}</div>}

            <button className="primary-button" type="submit" disabled={submitting}>
              {submitting ? <RefreshCw className="spin" size={18} /> : <>{mode === 'login' ? 'Sign in' : 'Create account'} <ArrowRight size={18} /></>}
            </button>
          </form>

          <button className="text-button" type="button" onClick={switchMode}>
            {mode === 'login' ? 'New here? Create an account' : 'Already have an account? Sign in'}
          </button>
        </div>
      </section>
    </main>
  )
}

function StatCard({ icon: Icon, label, value, suffix, tone }) {
  return (
    <article className={`stat-card ${tone}`}>
      <div className="stat-icon"><Icon size={21} /></div>
      <p>{label}</p>
      <strong>{value}<small>{suffix}</small></strong>
    </article>
  )
}

function ActivityRow({ activity, onEdit, onDelete }) {
  const detail = ACTIVITY_DETAILS[activity.activity_type] || ACTIVITY_DETAILS.run
  const Icon = detail.icon

  return (
    <article className="activity-row">
      <div className={`activity-icon ${detail.color}`}><Icon size={22} /></div>
      <div className="activity-main">
        <div className="activity-title-line">
          <h3>{detail.label}</h3>
          <time dateTime={activity.logged_at}>{formatDate(activity.logged_at)}</time>
        </div>
        <div className="activity-meta">
          <span>{activity.duration_mins} min</span>
          {activity.distance_km != null && <span>{formatActivityDistance(activity)}</span>}
          {activity.notes && <span className="activity-notes">{activity.notes}</span>}
        </div>
      </div>
      <div className="row-actions">
        <button className="icon-button" type="button" onClick={() => onEdit(activity)} aria-label={`Edit ${detail.label}`}><Pencil size={17} /></button>
        <button className="icon-button danger" type="button" onClick={() => onDelete(activity)} aria-label={`Delete ${detail.label}`}><Trash2 size={17} /></button>
      </div>
    </article>
  )
}

function ActivityModal({ activity, onClose, onSaved }) {
  const [form, setForm] = useState(activity ? {
    activity_type: activity.activity_type,
    duration_mins: activity.duration_mins,
    distance_km: distanceForForm(activity.activity_type, activity.distance_km),
    notes: activity.notes ?? '',
  } : EMPTY_ACTIVITY)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const editing = Boolean(activity)
  const distanceUnit = getDistanceUnit(form.activity_type)

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => {
      if (name !== 'activity_type' || current.distance_km === '') {
        return { ...current, [name]: value }
      }

      const distanceInKm = distanceForApi(current.activity_type, current.distance_km)
      return {
        ...current,
        activity_type: value,
        distance_km: distanceForForm(value, distanceInKm),
      }
    })
    setError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const payload = {
      activity_type: form.activity_type,
      duration_mins: Number(form.duration_mins),
      distance_km: distanceForApi(form.activity_type, form.distance_km),
      notes: form.notes.trim() || null,
    }

    try {
      await apiFetch(editing ? `/activities/${activity.id}/` : '/activities/', {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      })
      onSaved(editing ? 'Workout updated.' : 'Workout logged!')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="activity-modal-title">
        <div className="modal-header">
          <div>
            <p className="eyebrow">{editing ? 'Make a change' : 'Keep the momentum'}</p>
            <h2 id="activity-modal-title">{editing ? 'Edit workout' : 'Log a workout'}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close"><X size={20} /></button>
        </div>

        <form className="activity-form" onSubmit={handleSubmit}>
          <label htmlFor="activity_type">Activity</label>
          <select id="activity_type" name="activity_type" value={form.activity_type} onChange={updateField}>
            <option value="run">Run</option>
            <option value="lift">Lift</option>
            <option value="ride">Ride</option>
            <option value="swim">Swim</option>
          </select>

          <div className="form-grid">
            <div>
              <label htmlFor="duration_mins">Duration (minutes)</label>
              <input id="duration_mins" name="duration_mins" type="number" min="1" required value={form.duration_mins} onChange={updateField} placeholder="30" />
            </div>
            <div>
              <label htmlFor="distance_km">Distance ({distanceUnit})</label>
              <input
                id="distance_km"
                name="distance_km"
                type="number"
                min="0"
                step={distanceUnit === 'm' ? '1' : '0.1'}
                value={form.distance_km}
                onChange={updateField}
                placeholder={distanceUnit === 'm' ? 'e.g. 500' : 'Optional'}
              />
            </div>
          </div>

          <label htmlFor="notes">Notes</label>
          <textarea id="notes" name="notes" rows="4" value={form.notes} onChange={updateField} placeholder="How did it feel?" />

          {error && <div className="form-message error-message" role="alert">{error}</div>}

          <div className="modal-actions">
            <button className="secondary-button" type="button" onClick={onClose}>Cancel</button>
            <button className="primary-button compact" type="submit" disabled={submitting}>
              {submitting ? <RefreshCw className="spin" size={18} /> : editing ? 'Save changes' : 'Log workout'}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

function DeleteModal({ activity, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const label = ACTIVITY_DETAILS[activity.activity_type]?.label || 'workout'

  async function handleDelete() {
    setDeleting(true)
    setError('')
    try {
      await apiFetch(`/activities/${activity.id}/`, { method: 'DELETE' })
      onDeleted('Workout deleted.')
    } catch (requestError) {
      setError(requestError.message)
      setDeleting(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="modal-card small-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
        <div className="delete-bubble"><Trash2 size={24} /></div>
        <h2 id="delete-title">Delete this {label.toLowerCase()}?</h2>
        <p className="muted">This removes the workout from your FitLog. You can’t undo it.</p>
        {error && <div className="form-message error-message" role="alert">{error}</div>}
        <div className="modal-actions">
          <button className="secondary-button" type="button" onClick={onClose}>Keep it</button>
          <button className="delete-button" type="button" disabled={deleting} onClick={handleDelete}>
            {deleting ? <RefreshCw className="spin" size={18} /> : 'Delete workout'}
          </button>
        </div>
      </section>
    </div>
  )
}

function Dashboard({ username, onLogout }) {
  const [activities, setActivities] = useState([])
  const [stats, setStats] = useState(EMPTY_STATS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState(null)
  const [activityToDelete, setActivityToDelete] = useState(null)
  const [notice, setNotice] = useState('')

  const loadDashboard = useCallback(async ({ quiet = false } = {}) => {
    if (!quiet) setLoading(true)
    setError('')
    try {
      const [activityData, statData] = await Promise.all([
        apiFetch('/activities/'),
        apiFetch('/activities/stats/'),
      ])
      setActivities(activityData)
      setStats(statData)
    } catch (requestError) {
      if (requestError.status === 401) {
        onLogout()
      } else {
        setError(requestError.message)
      }
    } finally {
      setLoading(false)
    }
  }, [onLogout])

  // Loading remote data on mount intentionally drives the page's loading state.
  // oxlint-disable-next-line react/set-state-in-effect
  useEffect(() => { loadDashboard() }, [loadDashboard])

  useEffect(() => {
    if (!notice) return undefined
    const timeout = window.setTimeout(() => setNotice(''), 3200)
    return () => window.clearTimeout(timeout)
  }, [notice])

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }, [])

  function refreshAfterChange(message) {
    setEditor(null)
    setActivityToDelete(null)
    setNotice(message)
    loadDashboard({ quiet: true })
    window.setTimeout(() => loadDashboard({ quiet: true }), 1500)
  }

  return (
    <div className="dashboard-shell">
      <header className="topbar">
        <div className="wordmark"><div className="brand-mark tiny"><Dumbbell size={19} /></div><span>FitLog</span></div>
        <div className="header-user">
          <div className="avatar" aria-hidden="true">{username.slice(0, 1).toUpperCase()}</div>
          <span>{username}</span>
          <button className="icon-button" type="button" onClick={onLogout} aria-label="Sign out"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="dashboard-intro">
          <div>
            <p className="eyebrow">{greeting}, {username}</p>
            <h1>Keep your momentum.</h1>
            <p className="muted">Every bit of movement counts. Log today’s effort when you’re ready.</p>
          </div>
          <button className="primary-button add-button" type="button" onClick={() => setEditor({ activity: null })}><Plus size={19} /> Log workout</button>
          <div className="intro-bubble intro-one" />
          <div className="intro-bubble intro-two" />
        </section>

        {error && (
          <div className="page-error" role="alert">
            <span>{error}</span>
            <button type="button" onClick={() => loadDashboard()}>Try again</button>
          </div>
        )}

        <section className="stats-grid" aria-label="Workout statistics">
          <StatCard icon={ActivityIcon} label="Total workouts" value={stats.total_activities} tone="mint-card" />
          <StatCard icon={Route} label="Total distance" value={formatNumber(stats.total_distance)} suffix=" km" tone="peach-card" />
          <StatCard icon={CalendarDays} label="This week" value={formatNumber(stats.weekly_distance)} suffix=" km" tone="lavender-card" />
          <StatCard icon={Flame} label="Current streak" value={stats.current_streak} suffix={stats.current_streak === 1 ? ' day' : ' days'} tone="blue-card" />
        </section>

        <section className="activities-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Your timeline</p>
              <h2>Recent workouts</h2>
            </div>
            {!loading && activities.length > 0 && <span className="count-pill">{activities.length} total</span>}
          </div>

          {loading ? (
            <div className="list-state"><RefreshCw className="spin" size={24} /><p>Loading your workouts…</p></div>
          ) : activities.length === 0 ? (
            <div className="empty-state">
              <div className="empty-bubble"><Sparkles size={25} /></div>
              <h3>Your first workout starts here</h3>
              <p>Log a run, lift, ride, or swim and it’ll show up in this timeline.</p>
              <button className="secondary-button" type="button" onClick={() => setEditor({ activity: null })}><Plus size={17} /> Log your first workout</button>
            </div>
          ) : (
            <div className="activity-list">
              {activities.map((activity) => (
                <ActivityRow key={activity.id} activity={activity} onEdit={(item) => setEditor({ activity: item })} onDelete={setActivityToDelete} />
              ))}
            </div>
          )}
        </section>
      </main>

      {notice && <div className="toast" role="status"><Sparkles size={18} /> {notice}</div>}
      {editor && <ActivityModal activity={editor.activity} onClose={() => setEditor(null)} onSaved={refreshAfterChange} />}
      {activityToDelete && <DeleteModal activity={activityToDelete} onClose={() => setActivityToDelete(null)} onDeleted={refreshAfterChange} />}
    </div>
  )
}

function App() {
  const [session, setSession] = useState(() => hasSession())
  const [username, setUsername] = useState(() => getUsername())
  const [checkingSession, setCheckingSession] = useState(() => hasSession())

  const logout = useCallback(() => {
    clearSession()
    setSession(false)
    setUsername('Athlete')
    setCheckingSession(false)
  }, [])

  useEffect(() => {
    if (!session) return
    apiFetch('/activities/stats/')
      .then(() => setCheckingSession(false))
      .catch(() => logout())
  }, [session, logout])

  function handleAuthenticated(nextUsername) {
    setUsername(nextUsername)
    setSession(true)
    setCheckingSession(false)
  }

  if (session && checkingSession) return <LoadingScreen />
  if (!session) return <AuthScreen onAuthenticated={handleAuthenticated} />
  return <Dashboard username={username} onLogout={logout} />
}

export default App
