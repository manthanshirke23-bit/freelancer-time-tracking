// Display-only helpers. No money is calculated here; the backend does that.
const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export const formatCurrency = (value) => currencyFormatter.format(Number(value) || 0);

export const formatHours = (value) => `${Number(value) || 0} h`;

// The API returns ISO strings such as 2026-09-10T00:00:00.000Z. Keep the date part.
export const formatDate = (isoString) => (isoString ? String(isoString).slice(0, 10) : '');

export const todayString = () => new Date().toISOString().slice(0, 10);
