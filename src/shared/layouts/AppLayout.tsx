import { NavLink, Outlet } from "react-router";
import { logout } from "../../firebase/auth";
import { useAuth } from "../../firebase/useAuth";

export function AppLayout() {
  const { user } = useAuth();

  const getNavClassName = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "bottom-nav__link bottom-nav__link--active"
      : "bottom-nav__link";

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="app-header__label">Sesión iniciada</p>
          <strong>{user?.displayName ?? user?.email}</strong>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={() => logout()}
        >
          Salir
        </button>
      </header>

      <main className="app-content">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        <NavLink to="/" end className={getNavClassName}>
          <span className="bottom-nav__icon">I</span>
          <span>Inicio</span>
        </NavLink>

        <NavLink to="/cjcc" className={getNavClassName}>
          <span className="bottom-nav__icon">C</span>
          <span>CJCC</span>
        </NavLink>

        <NavLink to="/piero" className={getNavClassName}>
          <span className="bottom-nav__icon">P</span>
          <span>Piero</span>
        </NavLink>

        <NavLink to="/utn" className={getNavClassName}>
          <span className="bottom-nav__icon">U</span>
          <span>UTN</span>
        </NavLink>

        <NavLink to="/gimnasio" className={getNavClassName}>
          <span className="bottom-nav__icon">G</span>
          <span>Gym</span>
        </NavLink>
      </nav>
    </div>
  );
}