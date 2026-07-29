import { useState } from "react";
import { loginWithGoogle } from "../../firebase/auth";

export function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    try {
      setIsLoading(true);
      setError("");
      await loginWithGoogle();
    } catch (loginError) {
      console.error(loginError);
      setError("No se pudo iniciar sesión con Google.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <p className="login-card__eyebrow">Organización personal</p>

        <h1>App Nico</h1>

        <p className="login-card__description">
          Accedé a CJCC, Piero, UTN y tus rutinas de gimnasio.
        </p>

        <button
          type="button"
          className="login-button"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? "Ingresando..." : "Continuar con Google"}
        </button>

        {error && <p className="login-error">{error}</p>}
      </section>
    </main>
  );
}