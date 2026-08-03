import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  createInitialCjccCourses,
  getCjccCourses,
} from "./coursesRepository";
import type { CjccCourse } from "./types";

export function CjccPage() {
  const [courses, setCourses] = useState<
    CjccCourse[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  async function handleCreateInitialCourses() {
    try {
      setCreating(true);
      setError("");

      await createInitialCjccCourses();

      const savedCourses =
        await getCjccCourses();

      setCourses(savedCourses);
    } catch (createError) {
      console.error(createError);
      setError(
        "No se pudieron crear los cursos.",
      );
    } finally {
      setCreating(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    getCjccCourses()
      .then((savedCourses) => {
        if (!cancelled) {
          setCourses(savedCourses);
        }
      })
      .catch((loadError: unknown) => {
        console.error(loadError);

        if (!cancelled) {
          setError(
            "No se pudieron cargar los cursos.",
          );
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
    <section className="page page--cjcc">
      <header className="module-header module-header--cjcc">
        <p className="module-header__eyebrow">
          Escuela
        </p>

        <h1>CJCC</h1>

        <p>
          Cursos, estudiantes, evaluaciones,
          recuperatorios y seguimiento de contenidos.
        </p>
      </header>

      <div className="cjcc-module-actions">
        <Link
          className="primary-button primary-button--cjcc"
          to="/pendientes?modulo=cjcc"
        >
          Ver pendientes de CJCC
        </Link>
      </div>

      {loading && (
        <p className="status-message">
          Cargando cursos...
        </p>
      )}

      {!loading && courses.length === 0 && (
        <section className="empty-state">
          <h2>Todavía no hay cursos</h2>

          <p>
            Creá los cuatro cursos iniciales para
            comenzar.
          </p>

          <button
            type="button"
            className="primary-button primary-button--cjcc"
            onClick={handleCreateInitialCourses}
            disabled={creating}
          >
            {creating
              ? "Creando..."
              : "Crear cursos iniciales"}
          </button>
        </section>
      )}

      {!loading && courses.length > 0 && (
        <section className="subject-list">
          {courses.map((course) => (
            <Link
              className="subject-card subject-card--link"
              key={course.id}
              to={`/cjcc/${course.id}`}
            >
              <div>
                <span className="subject-card__code">
                  Matemática
                </span>

                <h2>{course.name}</h2>

                <div className="course-schedules">
                  {course.schedules.map(
                    (schedule) => (
                      <small key={schedule}>
                        {schedule}
                      </small>
                    ),
                  )}
                </div>
              </div>

              <span className="subject-card__status">
                Activo
              </span>
            </Link>
          ))}
        </section>
      )}

      {error && (
        <p className="form-error">{error}</p>
      )}
    </section>
  );
}

