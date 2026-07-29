import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { isRoutineActive } from "./activeRoutineStorage";
import {
  createExercise,
  deleteExercise,
  getExercises,
  updateExercise,
} from "./exercisesRepository";
import { ExerciseForm } from "./ExerciseForm";
import { ExerciseList } from "./ExerciseList";
import { getRoutineById } from "./routinesRepository";
import type {
  ExerciseFormData,
  GymExercise,
  GymRoutine,
} from "./types";

export function GymRoutinePage() {
  const { routineId } = useParams();

  const [routine, setRoutine] = useState<GymRoutine | null>(null);
  const [exercises, setExercises] = useState<GymExercise[]>([]);
  const [exerciseToEdit, setExerciseToEdit] =
    useState<GymExercise | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(Boolean(routineId));
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState(
    routineId ? "" : "No se indicó una rutina.",
  );

  const formContainerRef = useRef<HTMLDivElement | null>(null);
  const routineIsActive = Boolean(
    routineId && isRoutineActive(routineId),
  );

  async function reloadExercises() {
    if (!routineId) {
      return;
    }

    setExercises(await getExercises(routineId));
  }

  function scrollToForm() {
    window.requestAnimationFrame(() => {
      formContainerRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function handleAdd() {
    if (routineIsActive) {
      setError(
        "No podés agregar ejercicios mientras la rutina está activa.",
      );
      return;
    }

    setError("");
    setExerciseToEdit(null);
    setShowForm(true);
    scrollToForm();
  }

  function handleEdit(exercise: GymExercise) {
    if (routineIsActive) {
      setError(
        "No podés editar ejercicios mientras la rutina está activa.",
      );
      return;
    }

    setError("");
    setExerciseToEdit(exercise);
    setShowForm(true);
    scrollToForm();
  }

  function handleCancel() {
    setExerciseToEdit(null);
    setShowForm(false);
  }

  useEffect(() => {
    if (!routineId) {
      return;
    }

    let cancelled = false;

    Promise.all([
      getRoutineById(routineId),
      getExercises(routineId),
    ])
      .then(([savedRoutine, savedExercises]) => {
        if (!cancelled) {
          setRoutine(savedRoutine);
          setExercises(savedExercises);
        }
      })
      .catch((loadError: unknown) => {
        console.error(loadError);

        if (!cancelled) {
          setError("No se pudo cargar la rutina.");
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
  }, [routineId]);

  async function handleSubmit(data: ExerciseFormData) {
    if (!routineId || routineIsActive) {
      setError(
        "No podés modificar ejercicios mientras la rutina está activa.",
      );
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (exerciseToEdit) {
        await updateExercise(
          routineId,
          exerciseToEdit.id,
          data,
        );
      } else {
        await createExercise(
          routineId,
          data,
          exercises.length + 1,
        );
      }

      await reloadExercises();
      setExerciseToEdit(null);
      setShowForm(false);
    } catch (saveError) {
      console.error(saveError);
      setError("No se pudo guardar el ejercicio.");
      throw saveError;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(exerciseId: string) {
    if (!routineId) {
      return;
    }

    if (routineIsActive) {
      setError(
        "No podés eliminar ejercicios mientras la rutina está activa.",
      );
      return;
    }

    const confirmed = window.confirm(
      "¿Eliminar definitivamente este ejercicio?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setWorkingId(exerciseId);
      setError("");

      await deleteExercise(routineId, exerciseId);
      await reloadExercises();
    } catch (deleteError) {
      console.error(deleteError);
      setError("No se pudo eliminar el ejercicio.");
    } finally {
      setWorkingId(null);
    }
  }

  if (routineIsActive) {
    return <Navigate to="/gimnasio" replace />;
  }

  if (loading) {
    return <p className="status-message">Cargando rutina...</p>;
  }

  if (!routine || error && !routine) {
    return (
      <section className="empty-state">
        <h1>Rutina no encontrada</h1>
        <p>{error || "La rutina solicitada no existe."}</p>

        <Link className="text-link" to="/gimnasio">
          Volver a Gimnasio
        </Link>
      </section>
    );
  }

  return (
    <section className="gym-routine-page">
      <div className="gym-routine-page__top">
        <Link className="back-link back-link--gym" to="/gimnasio">
          ← Volver a rutinas
        </Link>

        <button
          type="button"
          className="inline-add-button inline-add-button--gym"
          onClick={handleAdd}
          disabled={routineIsActive}
        >
          + Agregar ejercicio
        </button>
      </div>

      <header className="module-header module-header--gym">
        <p className="module-header__eyebrow module-header__eyebrow--gym">
          {routineIsActive ? "Entrenamiento activo" : "Rutina"}
        </p>

        <h1>{routine.name}</h1>

        {routine.description && <p>{routine.description}</p>}
      </header>

      {routineIsActive && (
        <section className="gym-lock-notice">
          Esta rutina está activa. Cerrá el entrenamiento para modificar
          sus ejercicios.
        </section>
      )}

      <ExerciseList
        exercises={exercises}
        workingId={workingId}
        locked={routineIsActive}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {showForm && !routineIsActive && (
        <div
          ref={formContainerRef}
          className="item-form-container"
          key={exerciseToEdit?.id ?? "new-exercise-container"}
        >
          <ExerciseForm
            key={exerciseToEdit?.id ?? "new-exercise"}
            exerciseToEdit={exerciseToEdit}
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
    </section>
  );
}


