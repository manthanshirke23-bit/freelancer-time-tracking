export default function Loading({ text = 'Loading...' }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}
