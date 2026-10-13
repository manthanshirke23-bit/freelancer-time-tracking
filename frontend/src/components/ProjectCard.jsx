import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';

export default function ProjectCard({ project }) {
  return (
    <article className="card project-card">
      <h3>{project.name}</h3>
      <p className="muted">{project.client?.name || 'No client'}</p>
      {project.description && <p className="project-description">{project.description}</p>}
      <p className="project-rate">
        {formatCurrency(project.hourlyRate)} <span className="muted">per hour</span>
      </p>
      <div className="card-actions">
        <Link className="btn btn-secondary btn-small" to={`/log-time?project=${project._id}`}>
          Log Time
        </Link>
        <Link className="btn btn-small" to={`/invoice/${project._id}`}>
          View Invoice
        </Link>
      </div>
    </article>
  );
}
