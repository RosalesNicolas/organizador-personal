import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { DeliveriesSection } from "./DeliveriesSection";
import { ExamsSection } from "./ExamsSection";
import { NotesSection } from "./NotesSection";
import { getSubjectById } from "./subjectsRepository";
import type { UtnSubject } from "./types";

type SubjectSection = "entregas" | "parciales" | "notas";

export function UtnSubjectPage() {
  const { subjectId } = useParams();

  const [subject, setSubject] = useState<UtnSubject | null>(null);
  const [activeSection, setActiveSection] =
    useState<SubjectSection>("entregas");
  const [loading, setLoading] = useState(Boolean(subjectId));
  const [error, setError] = useState(
    subjectId ? "" : "No se indicó una materia.",
  );

  useEffect(() => {
    if (!subjectId) {
      return;
    }

    let cancelled = false;

    getSubjectById(subjectId)
      .then((savedSubject) => {
        if (!cancelled) {
          setSubject(savedSubject);
        }
      })
      .catch((loadError: unknown) => {
        console.error(loadError);

        if (!cancelled) {
          setError("No se pudo cargar la materia.");
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
  }, [subjectId]);

  if (loading) {
    return <p className="status-message">Cargando materia...</p>;
  }

  if (error || !subject) {
    return (
      <section className="empty-state">
        <h1>Materia no encontrada</h1>
        <p>{error || "La materia solicitada no existe."}</p>

        <Link className="text-link" to="/utn">
          Volver a UTN
        </Link>
      </section>
    );
  }

  return (
    <section className="utn-page">
      <Link className="back-link" to="/utn">
        ← Volver a materias
      </Link>

      <header className="module-header module-header--utn">
        <p className="module-header__eyebrow">{subject.code}</p>
        <h1>{subject.name}</h1>
        <p>Organización de entregas, parciales y notas personales.</p>
      </header>

      <nav className="subject-tabs" aria-label="Secciones de la materia">
        <button
          type="button"
          className={
            activeSection === "entregas"
              ? "subject-tab subject-tab--active"
              : "subject-tab"
          }
          onClick={() => setActiveSection("entregas")}
        >
          Entregas
        </button>

        <button
          type="button"
          className={
            activeSection === "parciales"
              ? "subject-tab subject-tab--active"
              : "subject-tab"
          }
          onClick={() => setActiveSection("parciales")}
        >
          Parciales
        </button>

        <button
          type="button"
          className={
            activeSection === "notas"
              ? "subject-tab subject-tab--active"
              : "subject-tab"
          }
          onClick={() => setActiveSection("notas")}
        >
          Notas
        </button>
      </nav>

      <section className="subject-section subject-section--transparent">
        {activeSection === "entregas" && (
          <DeliveriesSection subjectId={subject.id} />
        )}

        {activeSection === "parciales" && (
          <ExamsSection subjectId={subject.id} />
        )}

        {activeSection === "notas" && (
          <NotesSection subjectId={subject.id} />
        )}
      </section>
    </section>
  );
}
