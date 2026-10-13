import { useEffect, useState } from 'react';
import Loading from '../components/Loading';
import ProjectCard from '../components/ProjectCard';
import api, { getErrorMessage } from '../services/api';

const emptyProjectForm = { name: '', description: '', client: '', hourlyRate: '' };
const emptyClientForm = { name: '', email: '', phone: '' };

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [projectForm, setProjectForm] = useState(emptyProjectForm);
  const [clientForm, setClientForm] = useState(emptyClientForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text }

  const loadData = async () => {
    try {
      const [projectsRes, clientsRes] = await Promise.all([api.get('/projects'), api.get('/clients')]);
      setProjects(projectsRes.data);
      setClients(clientsRes.data);
    } catch (err) {
      setFeedback({ type: 'error', text: getErrorMessage(err, 'Could not load projects.') });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const updateProjectField = (field) => (event) =>
    setProjectForm((current) => ({ ...current, [field]: event.target.value }));

  const updateClientField = (field) => (event) =>
    setClientForm((current) => ({ ...current, [field]: event.target.value }));

  const handleAddClient = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      const { data } = await api.post('/clients', clientForm);
      setClients((current) => [data, ...current]);
      setProjectForm((current) => ({ ...current, client: data._id })); // select the new client
      setClientForm(emptyClientForm);
      setFeedback({ type: 'success', text: `Client "${data.name}" added.` });
    } catch (err) {
      setFeedback({ type: 'error', text: getErrorMessage(err, 'Could not add the client.') });
    } finally {
      setSaving(false);
    }
  };

  const handleAddProject = async (event) => {
    event.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      const { data } = await api.post('/projects', {
        ...projectForm,
        hourlyRate: Number(projectForm.hourlyRate),
      });
      setProjects((current) => [data, ...current]);
      setProjectForm(emptyProjectForm);
      setFeedback({ type: 'success', text: `Project "${data.name}" created.` });
    } catch (err) {
      setFeedback({ type: 'error', text: getErrorMessage(err, 'Could not create the project.') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading text="Loading projects..." />;

  return (
    <div>
      <h1>Projects</h1>

      {feedback && (
        <div className={`alert alert-${feedback.type}`} role={feedback.type === 'error' ? 'alert' : 'status'}>
          {feedback.text}
        </div>
      )}

      <div className="two-column">
        <section className="card">
          <h2>New project</h2>
          <form onSubmit={handleAddProject}>
            <div className="field">
              <label htmlFor="project-name">Project name</label>
              <input id="project-name" type="text" value={projectForm.name} onChange={updateProjectField('name')} required />
            </div>
            <div className="field">
              <label htmlFor="project-client">Client</label>
              <select id="project-client" value={projectForm.client} onChange={updateProjectField('client')} required>
                <option value="">{clients.length === 0 ? 'Add a client first' : 'Select a client'}</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="project-rate">Hourly rate (INR)</label>
              <input id="project-rate" type="number" min="0" step="any" inputMode="decimal" value={projectForm.hourlyRate} onChange={updateProjectField('hourlyRate')} required />
            </div>
            <div className="field">
              <label htmlFor="project-description">Description (optional)</label>
              <textarea id="project-description" rows="2" value={projectForm.description} onChange={updateProjectField('description')} />
            </div>
            <button type="submit" className="btn" disabled={saving || clients.length === 0}>
              {saving ? 'Saving...' : 'Create project'}
            </button>
          </form>
        </section>

        <section className="card">
          <h2>New client</h2>
          <p className="muted">A project needs a client. Add one here first.</p>
          <form onSubmit={handleAddClient}>
            <div className="field">
              <label htmlFor="client-name">Client name</label>
              <input id="client-name" type="text" value={clientForm.name} onChange={updateClientField('name')} required />
            </div>
            <div className="field">
              <label htmlFor="client-email">Email (optional)</label>
              <input id="client-email" type="email" value={clientForm.email} onChange={updateClientField('email')} />
            </div>
            <div className="field">
              <label htmlFor="client-phone">Phone (optional)</label>
              <input id="client-phone" type="tel" value={clientForm.phone} onChange={updateClientField('phone')} />
            </div>
            <button type="submit" className="btn btn-secondary" disabled={saving}>
              {saving ? 'Saving...' : 'Add client'}
            </button>
          </form>
        </section>
      </div>

      <h2 className="list-heading">Your projects</h2>
      {projects.length === 0 ? (
        <p className="muted">No projects yet. Create your first one above.</p>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
