import { useState } from "react";
import { testFirestoreConnection } from "../../firebase/firestoreTest";
import { ModuleCard } from "../../shared/components/ModuleCard";

export function InicioPage() {
  const [message, setMessage] = useState("");
  const [testing, setTesting] = useState(false);

  async function handleTestFirestore() {
    try {
      setTesting(true);
      setMessage("");

      const data = await testFirestoreConnection();

      setMessage(String(data.mensaje));
    } catch (error) {
      console.error(error);
      setMessage("Error al conectar con Firestore.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <section className="home-page">
      <header className="home-header">
        <p className="home-header__eyebrow">Organización personal</p>
        <h1>Inicio</h1>
        <p>Resumen de clases, pendientes y próximos vencimientos.</p>
      </header>

      <section className="summary-section">
        <h2>Conexión</h2>

        <button
          type="button"
          className="test-button"
          onClick={handleTestFirestore}
          disabled={testing}
        >
          {testing ? "Probando..." : "Probar Firestore"}
        </button>

        {message && <p>{message}</p>}
      </section>

      <section className="modules-grid">
        <ModuleCard
          title="CJCC"
          description="Cursos, estudiantes y evaluaciones."
          accentClass="module-card--cjcc"
        />

        <ModuleCard
          title="Piero"
          description="Clases, contenidos y tareas."
          accentClass="module-card--piero"
        />

        <ModuleCard
          title="UTN"
          description="Materias, parciales y entregas."
          accentClass="module-card--utn"
        />

        <ModuleCard
          title="Gimnasio"
          description="Rutinas, ejercicios y cronómetros."
          accentClass="module-card--gym"
        />
      </section>
    </section>
  );
}