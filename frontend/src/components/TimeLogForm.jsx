import { useEffect, useState } from 'react';
import { todayString } from '../utils/format';

// Presentational form. The parent page sends the data to the API via onSubmit
// (which must return a promise) and decides what to show afterwards.
export default function TimeLogForm({ projects, initialProjectId = '', onSubmit }) {
  const [project, setProject] = useState(initialProjectId);
  const [date, setDate] = useState(todayString());
  const [hours, setHours] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Keep the selection in sync if the ?project= value arrives after first render.
  useEffect(() => {
    if (initialProjectId) setProject(initialProjectId);
  }, [initialProjectId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    const saved = await onSubmit({ project, date, hours: Number(hours), description });
    setSubmitting(false);
    if (saved) {
      setHours('');
      setDescription('');
    }
  };

  return (
    <form className="form-grid" onSubmit={handleSubmit}>
      <div className="field field-wide">
        <label htmlFor="log-project">Project</label>
        <select id="log-project" value={project} onChange={(e) => setProject(e.target.value)} required>
          <option value="">Select a project</option>
          {projects.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} ({p.client?.name || 'No client'})
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="log-date">Date</label>
        <input id="log-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
      </div>

      <div className="field">
        <label htmlFor="log-hours">Hours</label>
        <input
          id="log-hours"
          type="number"
          min="0.01"
          step="0.01"
          inputMode="decimal"
          placeholder="e.g. 2.5"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          required
        />
      </div>

      <div className="field field-wide">
        <label htmlFor="log-description">Description (optional)</label>
        <textarea
          id="log-description"
          rows="3"
          placeholder="What did you work on?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="field-wide">
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Saving...' : 'Save time log'}
        </button>
      </div>
    </form>
  );
}
