import type { ReactNode } from "react";
import { useAuth } from "../../firebase/useAuth";
import { LoginPage } from "../../modules/auth/LoginPage";

type ProtectedAppProps = {
  children: ReactNode;
};

export function ProtectedApp({ children }: ProtectedAppProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="auth-loading">
        <p>Cargando aplicación...</p>
      </main>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return children;
}