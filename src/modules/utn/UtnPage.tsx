import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  createInitialSubjects,
  getSubjects,
} from "./subjectsRepository";
import type { UtnSubject } from "./types";

export function UtnPage() {
  const [subjects, setSubjects] = useState<UtnSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function loadSubjectsAfterAction() {
    try {
      setLoading(true);
      setError("");

      const savedSubjects = await getSubjects();
      setSubjects(savedSubjects);
    } catch (loadError) {
      console.error(loadError);
      setError("No se pudieron cargar las materias.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateInitialSubjects() {
    try {
      setCreating(true);
      setError("");

      await createInitialSubjects();
      await loadSubjectsAfterAction();
    } catch (createError) {
      console.error(createError);
      setError("No se pudieron crear las materias.");
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    getSubjects()
      .then((savedSubjects) => {
        if (!cancelled) {
          setSubjects(savedSubjects);
        }
      })
      .catch((loadError: unknown) => {
        console.error(loadError);

        if (!cancelled) {
          setError("No se pudieron cargar las materias.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="utn-page">
      <header className="module-header module-header--utn">
        <p className="module-header__eyebrow">Facultad</p>
        <h1>UTN</h1>
        <p>Materias, parciales, entregas y notas personales.</p>
      </header>

      <div className="utn-module-actions">
        <Link
          className="primary-button primary-button--utn"
          to="/pendientes?modulo=utn"
        >
          Ver pendientes de UTN
        </Link>
      </div>

      {loading && <p className="status-message">Cargando materias...</p>}

      {!loading && subjects.length === 0 && (
        <section className="empty-state">
          <h2>Todavía no hay materias</h2>

          <p>
            Cargá las cinco materias iniciales para comenzar a organizar la
            facultad.
          </p>

          <button
            type="button"
            className="primary-button primary-button--utn"
            onClick={handleCreateInitialSubjects}
            disabled={creating}
          >
            {creating ? "Creando..." : "Crear materias iniciales"}
          </button>
        </section>
      )}

      {!loading && subjects.length > 0 && (
        <section className="subject-list">
          {subjects.map((subject) => (
            <Link
              className="subject-card subject-card--link"
              key={subject.id}
              to={`/utn/${subject.id}`}
            >
              <div>
                <span className="subject-card__code">{subject.code}</span>
                <h2>{subject.name}</h2>
              </div>

              <span className="subject-card__status">Activa</span>
            </Link>
          ))}
        </section>
      )}

      {error && <p className="form-error">{error}</p>}
    </section>
  );
}

