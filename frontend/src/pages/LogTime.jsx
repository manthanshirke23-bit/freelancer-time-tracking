import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Loading from '../components/Loading';
import TimeLogForm from '../components/TimeLogForm';
import api, { getErrorMessage } from '../services/api';

export default function LogTime() {
  const [searchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text }

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const { data } = await api.get('/projects');
        setProjects(data);
      } catch (err) {
        setFeedback({ type: 'error', text: getErrorMessage(err, 'Could not load your projects.') });
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  // Returns true when the log was saved, so the form knows whether to reset itself.
  const handleSubmit = async (values) => {
    setFeedback(null);
    try {
      await api.post('/time-logs', values);
      setFeedback({ type: 'success', text: 'Time log saved.' });
      return true;
    } catch (err) {
      setFeedback({ type: 'error', text: getErrorMessage(err, 'Could not save the time log.') });
      return false;
    }
  };

  if (loading) return <Loading text="Loading projects..." />;

  return (
    <div>
      <h1>Log time</h1>

      {feedback && (
        <div className={`alert alert-${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
          {feedback.text}
        </div>
      )}

      <section className="card narrow">
        {projects.length === 0 ? (
          <p className="muted">
            You have no projects yet. <Link to="/projects">Create a project</Link> before logging time.
          </p>
        ) : (
          <TimeLogForm
            projects={projects}
            initialProjectId={searchParams.get('project') || ''}
            onSubmit={handleSubmit}
          />
        )}
      </section>
    </div>
  );
}
