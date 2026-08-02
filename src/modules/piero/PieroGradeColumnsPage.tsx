import { useEffect, useState } from "react";
import {
  Link,
  useParams,
} from "react-router";
import { getCourseById } from "./coursesRepository";
import {
  createGradeColumn,
  deleteGradeColumn,
  getGradeColumns,
  renameGradeColumn,
} from "./gradeColumnsRepository";
import type {
  PieroCourse,
  PieroGradeColumn,
} from "./types";

export function PieroGradeColumnsPage() {
  const { courseId } = useParams();

  const [course, setCourse] =
    useState<PieroCourse | null>(null);

  const [columns, setColumns] = useState<
    PieroGradeColumn[]
  >([]);

  const [newColumnName, setNewColumnName] =
    useState("");

  const [editingColumnId, setEditingColumnId] =
    useState<string | null>(null);

  const [editingColumnName, setEditingColumnName] =
    useState("");

  const [creating, setCreating] = useState(false);

  const [actionColumnId, setActionColumnId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function reloadColumns(
    validCourseId: string,
  ) {
    const savedColumns =
      await getGradeColumns(validCourseId);

    setColumns(savedColumns);
  }

  async function handleCreateColumn() {
    if (!courseId) {
      return;
    }

    const normalizedName =
      newColumnName.trim();

    if (!normalizedName) {
      setError(
        "Ingresá un nombre para la columna.",
      );
      return;
    }

    try {
      setCreating(true);
      setError("");

      await createGradeColumn(
        courseId,
        normalizedName,
        columns.length,
      );

      setNewColumnName("");
      await reloadColumns(courseId);
    } catch (createError) {
      console.error(createError);
      setError(
        "No se pudo crear la columna.",
      );
    } finally {
      setCreating(false);
    }
  }

  function handleStartRename(
    column: PieroGradeColumn,
  ) {
    setEditingColumnId(column.id);
    setEditingColumnName(column.name);
  }

  function handleCancelRename() {
    setEditingColumnId(null);
    setEditingColumnName("");
  }

  async function handleRename(
    column: PieroGradeColumn,
  ) {
    if (!courseId) {
      return;
    }

    const normalizedName =
      editingColumnName.trim();

    if (!normalizedName) {
      setError(
        "El nombre no puede quedar vacío.",
      );
      return;
    }

    try {
      setActionColumnId(column.id);
      setError("");

      await renameGradeColumn(
        courseId,
        column.id,
        normalizedName,
      );

      setEditingColumnId(null);
      setEditingColumnName("");

      await reloadColumns(courseId);
    } catch (renameError) {
      console.error(renameError);
      setError(
        "No se pudo renombrar la columna.",
      );
    } finally {
      setActionColumnId(null);
    }
  }

  async function handleDelete(
    column: PieroGradeColumn,
  ) {
    if (!courseId) {
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar la columna "${column.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionColumnId(column.id);
      setError("");

      await deleteGradeColumn(
        courseId,
        column.id,
      );

      await reloadColumns(courseId);
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        "No se pudo eliminar la columna.",
      );
    } finally {
      setActionColumnId(null);
    }
  }

  useEffect(() => {
    if (!courseId) {
      return;
    }

    let cancelled = false;

    Promise.all([
      getCourseById(courseId),
      getGradeColumns(courseId),
    ])
      .then(([savedCourse, savedColumns]) => {
        if (!cancelled) {
          setCourse(savedCourse);
          setColumns(savedColumns);
        }
      })
      .catch((loadError: unknown) => {
        console.error(loadError);

        if (!cancelled) {
          setError(
            "No se pudieron cargar las columnas.",
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
  }, [courseId]);

  if (!courseId) {
    return (
      <section className="page page--piero">
        <p className="form-error">
          El curso no es válido.
        </p>
      </section>
    );
  }

  if (loading) {
    return (
      <p className="status-message">
        Cargando columnas...
      </p>
    );
  }

  if (!course) {
    return (
      <section className="page page--piero">
        <p className="form-error">
          No se encontró el curso.
        </p>

        <Link to="/piero">
          Volver a Piero
        </Link>
      </section>
    );
  }

  return (
    <section className="page page--piero">
      <Link
        className="back-link"
        to={`/piero/${courseId}`}
      >
        ← Volver al curso
      </Link>

      <header className="module-header module-header--piero">
        <p className="module-header__eyebrow">
          Calificaciones
        </p>

        <h1>Columnas</h1>

        <p>{course.name}</p>
      </header>

      <section className="grade-columns-page">
        <div className="section-toolbar">
          <div>
            <h2>Columnas de notas</h2>

            <p>
              {columns.length === 1
                ? "1 columna"
                : `${columns.length} columnas`}
            </p>
          </div>
        </div>

        <div className="grade-column-create">
          <input
            type="text"
            value={newColumnName}
            onChange={(event) =>
              setNewColumnName(
                event.target.value,
              )
            }
            placeholder="Ejemplo: Simulacro 1"
            disabled={creating}
          />

          <button
            type="button"
            className="primary-button primary-button--piero"
            onClick={handleCreateColumn}
            disabled={creating}
          >
            {creating
              ? "Agregando..."
              : "Agregar columna"}
          </button>
        </div>

        {columns.length === 0 && (
          <section className="empty-state">
            <h2>No hay columnas creadas</h2>

            <p>
              Agregá la primera columna para comenzar
              a registrar calificaciones.
            </p>
          </section>
        )}

        {columns.length > 0 && (
          <section className="grade-column-list">
            {columns.map((column) => (
              <article
                className="grade-column-item"
                key={column.id}
              >
                {editingColumnId === column.id ? (
                  <input
                    type="text"
                    value={editingColumnName}
                    onChange={(event) =>
                      setEditingColumnName(
                        event.target.value,
                      )
                    }
                    disabled={
                      actionColumnId === column.id
                    }
                  />
                ) : (
                  <strong>{column.name}</strong>
                )}

                <div>
                  {editingColumnId === column.id ? (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleRename(column)
                        }
                        disabled={
                          actionColumnId === column.id
                        }
                      >
                        Guardar
                      </button>

                      <button
                        type="button"
                        onClick={handleCancelRename}
                        disabled={
                          actionColumnId === column.id
                        }
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          handleStartRename(column)
                        }
                      >
                        Renombrar
                      </button>

                      <button
                        type="button"
                        className="danger-button"
                        onClick={() =>
                          handleDelete(column)
                        }
                        disabled={
                          actionColumnId === column.id
                        }
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}
      </section>

      {error && (
        <p className="form-error">{error}</p>
      )}
    </section>
  );
}
