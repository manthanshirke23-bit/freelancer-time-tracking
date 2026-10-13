import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loading from '../components/Loading';
import api, { getErrorMessage, getStoredUser } from '../services/api';
import { formatDate, formatHours } from '../utils/format';

const RECENT_LOG_COUNT = 5;

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [projects, setProjects] = useState([]);
  const [timeLogs, setTimeLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = getStoredUser();

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [clientsRes, projectsRes, logsRes] = await Promise.all([
          api.get('/clients'),
          api.get('/projects'),
          api.get('/time-logs'),
        ]);
        setClients(clientsRes.data);
        setProjects(projectsRes.data);
        setTimeLogs(logsRes.data);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load the dashboard.'));
      } finally {
        setLoading(false);
      }
    };
    loadDashboard();
  }, []);

  if (loading) return <Loading text="Loading dashboard..." />;

  // Only hours are added up here. Money (hours x rate) is always calculated by the backend.
  const totalHours = Number(timeLogs.reduce((sum, log) => sum + log.hours, 0).toFixed(2));
  const recentLogs = timeLogs.slice(0, RECENT_LOG_COUNT); // API returns newest first

  return (
    <div>
      <h1>Welcome{user?.name ? `, ${user.name}` : ''}</h1>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      <section className="stats-grid" aria-label="Summary">
        <div className="card stat">
          <span className="stat-value">{clients.length}</span>
          <span className="stat-label">Clients</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{projects.length}</span>
          <span className="stat-label">Projects</span>
        </div>
        <div className="card stat">
          <span className="stat-value">{formatHours(totalHours)}</span>
          <span className="stat-label">Hours logged</span>
        </div>
      </section>

      <section className="card">
        <div className="section-header">
          <h2>Recent time logs</h2>
          <Link className="btn btn-small" to="/log-time">Log time</Link>
        </div>

        {recentLogs.length === 0 ? (
          <p className="muted">
            No time logged yet. <Link to="/projects">Create a project</Link>, then log your first hours.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Project</th>
                  <th className="num">Hours</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((log) => (
                  <tr key={log._id}>
                    <td>{formatDate(log.date)}</td>
                    <td>{log.project?.name || 'Deleted project'}</td>
                    <td className="num">{log.hours}</td>
                    <td>{log.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
