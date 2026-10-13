import { Navigate, useLocation } from 'react-router-dom';
import { isLoggedIn } from '../services/api';

// Sends visitors without a token to /login, remembering where they wanted to go.
export default function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
