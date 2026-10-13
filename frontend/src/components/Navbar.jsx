import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { clearAuth, getStoredUser, isLoggedIn } from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  useLocation(); // re-render on every navigation so the login state stays fresh

  const loggedIn = isLoggedIn();
  const user = getStoredUser();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <span className="brand">Time &amp; Invoice</span>

        {loggedIn ? (
          <>
            <nav className="nav-links" aria-label="Main">
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/projects">Projects</NavLink>
              <NavLink to="/log-time">Log Time</NavLink>
            </nav>
            <div className="nav-user">
              <span className="nav-username">{user?.name}</span>
              <button type="button" className="btn btn-secondary btn-small" onClick={handleLogout}>
                Log out
              </button>
            </div>
          </>
        ) : (
          <nav className="nav-links nav-guest" aria-label="Account">
            <NavLink to="/login">Log in</NavLink>
            <NavLink to="/register">Register</NavLink>
          </nav>
        )}
      </div>
    </header>
  );
}
