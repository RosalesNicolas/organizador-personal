import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { isRoutineActive } from "./activeRoutineStorage";
import {
  createExercise,
  deleteExercise,
  getExercises,
  saveExerciseOrder,
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

  const [routine, setRoutine] =
    useState<GymRoutine | null>(null);
  const [exercises, setExercises] =
    useState<GymExercise[]>([]);
  const [exerciseToEdit, setExerciseToEdit] =
    useState<GymExercise | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] =
    useState(Boolean(routineId));
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] =
    useState<string | null>(null);
  const [error, setError] = useState(
    routineId ? "" : "No se indicó una rutina.",
  );

  const formContainerRef =
    useRef<HTMLDivElement | null>(null);

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
      return;
    }

    setError("");
    setExerciseToEdit(null);
    setShowForm(true);
    scrollToForm();
  }

  function handleEdit(exercise: GymExercise) {
    if (routineIsActive) {
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
          setError(
            "No se pudo cargar la rutina.",
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
  }, [routineId]);

  async function handleSubmit(
    data: ExerciseFormData,
  ) {
    if (!routineId || routineIsActive) {
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
      setError(
        "No se pudo guardar el ejercicio.",
      );
      throw saveError;
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(exerciseId: string) {
    if (!routineId || routineIsActive) {
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

      const remainingExercises = exercises.filter(
        (exercise) => exercise.id !== exerciseId,
      );

      await saveExerciseOrder(
        routineId,
        remainingExercises,
      );

      await reloadExercises();
    } catch (deleteError) {
      console.error(deleteError);
      setError(
        "No se pudo eliminar el ejercicio.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  async function moveExercise(
    exerciseId: string,
    direction: -1 | 1,
  ) {
    if (
      !routineId ||
      routineIsActive ||
      exerciseToEdit
    ) {
      return;
    }

    const currentIndex = exercises.findIndex(
      (exercise) => exercise.id === exerciseId,
    );

    const targetIndex = currentIndex + direction;

    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= exercises.length
    ) {
      return;
    }

    const reorderedExercises = [...exercises];

    [
      reorderedExercises[currentIndex],
      reorderedExercises[targetIndex],
    ] = [
      reorderedExercises[targetIndex],
      reorderedExercises[currentIndex],
    ];

    try {
      setWorkingId(exerciseId);
      setError("");

      setExercises(reorderedExercises);

      await saveExerciseOrder(
        routineId,
        reorderedExercises,
      );

      await reloadExercises();
    } catch (moveError) {
      console.error(moveError);
      setError(
        "No se pudo cambiar el orden.",
      );

      await reloadExercises();
    } finally {
      setWorkingId(null);
    }
  }

  if (routineIsActive) {
    return <Navigate to="/gimnasio" replace />;
  }

  if (loading) {
    return (
      <p className="status-message">
        Cargando rutina...
      </p>
    );
  }

  if (!routine || (error && !routine)) {
    return (
      <section className="empty-state">
        <h1>Rutina no encontrada</h1>

        <p>
          {error ||
            "La rutina solicitada no existe."}
        </p>

        <Link className="text-link" to="/gimnasio">
          Volver a Gimnasio
        </Link>
      </section>
    );
  }

  return (
    <section className="gym-routine-page">
      <div className="gym-routine-page__top">
        <Link
          className="back-link back-link--gym"
          to="/gimnasio"
        >
          ← Volver a rutinas
        </Link>

        <button
          type="button"
          className="inline-add-button inline-add-button--gym"
          onClick={handleAdd}
          disabled={Boolean(exerciseToEdit)}
        >
          + Agregar ejercicio
        </button>
      </div>

      <header className="module-header module-header--gym">
        <p className="module-header__eyebrow module-header__eyebrow--gym">
          Rutina
        </p>

        <h1>{routine.name}</h1>

        {routine.description && (
          <p>{routine.description}</p>
        )}

        <p className="gym-routine-page__count">
          {exercises.length}{" "}
          {exercises.length === 1
            ? "ejercicio"
            : "ejercicios"}
        </p>
      </header>

      <ExerciseList
        exercises={exercises}
        workingId={workingId}
        editingExerciseId={
          exerciseToEdit?.id ?? null
        }
        locked={false}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onMoveUp={(exerciseId) =>
          moveExercise(exerciseId, -1)
        }
        onMoveDown={(exerciseId) =>
          moveExercise(exerciseId, 1)
        }
      />

      {showForm && (
        <div
          ref={formContainerRef}
          className="item-form-container"
          key={
            exerciseToEdit?.id ??
            "new-exercise-container"
          }
        >
          <ExerciseForm
            key={
              exerciseToEdit?.id ??
              "new-exercise"
            }
            exerciseToEdit={exerciseToEdit}
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      )}

      {error && (
        <p className="form-error">{error}</p>
      )}
    </section>
  );
}
