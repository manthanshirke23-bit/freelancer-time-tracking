import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Loading from '../components/Loading';
import api, { getErrorMessage } from '../services/api';
import { formatCurrency, formatHours } from '../utils/format';

export default function InvoiceSummary() {
  const { projectId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInvoice = async () => {
      setLoading(true);
      setError('');
      try {
        // The backend calculates the total with a MongoDB aggregation.
        // This page only displays what the server returns.
        const { data } = await api.get(`/projects/${projectId}/invoice-total`);
        setInvoice(data);
      } catch (err) {
        setError(getErrorMessage(err, 'Could not load the invoice.'));
      } finally {
        setLoading(false);
      }
    };
    loadInvoice();
  }, [projectId]);

  if (loading) return <Loading text="Loading invoice..." />;

  if (error) {
    return (
      <div>
        <h1>Invoice</h1>
        <div className="alert alert-error" role="alert">{error}</div>
        <Link className="btn btn-secondary" to="/projects">Back to projects</Link>
      </div>
    );
  }

  return (
    <div>
      <h1>Invoice summary</h1>

      <section className="card invoice">
        <dl className="invoice-details">
          <div>
            <dt>Project</dt>
            <dd>{invoice.project.name}</dd>
          </div>
          <div>
            <dt>Client</dt>
            <dd>{invoice.project.client?.name || 'No client'}</dd>
          </div>
          <div>
            <dt>Hourly rate</dt>
            <dd>{formatCurrency(invoice.project.hourlyRate)}</dd>
          </div>
          <div>
            <dt>Total hours</dt>
            <dd>{formatHours(invoice.totalHours)}</dd>
          </div>
        </dl>

        <div className="invoice-total">
          <span>Invoice total</span>
          <strong>{formatCurrency(invoice.invoiceTotal)}</strong>
        </div>
      </section>

      <div className="button-row">
        <Link className="btn btn-secondary" to="/projects">Back to projects</Link>
        <Link className="btn" to={`/log-time?project=${invoice.project.id}`}>Log more time</Link>
      </div>
    </div>
  );
}
