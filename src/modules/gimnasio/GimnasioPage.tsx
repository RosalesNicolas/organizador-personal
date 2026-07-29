import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { getExercises } from "./exercisesRepository";
import {
  clearActiveRoutineId,
  getActiveRoutineId,
  setActiveRoutineId,
} from "./activeRoutineStorage";
import {
  archiveRoutine,
  createRoutine,
  getRoutines,
  permanentlyDeleteRoutine,
  restoreRoutine,
  updateRoutine,
} from "./routinesRepository";
import { RoutineForm } from "./RoutineForm";
import { RoutineList } from "./RoutineList";
import type {
  GymRoutine,
  RoutineFormData,
} from "./types";

export function GimnasioPage() {
  const navigate = useNavigate();

  const [routines, setRoutines] = useState<GymRoutine[]>([]);
  const [routineToEdit, setRoutineToEdit] =
    useState<GymRoutine | null>(null);
  const [selectedRoutine, setSelectedRoutine] =
    useState<GymRoutine | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workingId, setWorkingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const formContainerRef = useRef<HTMLDivElement | null>(null);

  async function reloadRoutines() {
    const savedRoutines = await getRoutines();

    setRoutines(savedRoutines);

    const activeRoutineId = getActiveRoutineId();
    const activeRoutine =
      savedRoutines.find(
        (routine) => routine.id === activeRoutineId,
      ) ?? null;

    setSelectedRoutine(activeRoutine);

    if (activeRoutineId && !activeRoutine) {
      clearActiveRoutineId();
    }
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
    if (selectedRoutine) {
      setError(
        "Primero finalizá el entrenamiento activo.",
      );
      return;
    }

    setError("");
    setRoutineToEdit(null);
    setShowForm(true);
    scrollToForm();
  }

  function handleEdit(routine: GymRoutine) {
    if (selectedRoutine?.id === routine.id) {
      setError(
        "Primero finalizá el entrenamiento activo.",
      );
      return;
    }

    setError("");
    setRoutineToEdit(routine);
    setShowForm(true);
    scrollToForm();
  }

  function handleCancelForm() {
    setRoutineToEdit(null);
    setShowForm(false);
  }

  async function handleStartWorkout(
    routine: GymRoutine,
  ) {
    if (
      selectedRoutine &&
      selectedRoutine.id !== routine.id
    ) {
      setError(
        "Ya existe otro entrenamiento activo.",
      );
      return;
    }

    try {
      setWorkingId(routine.id);
      setError("");

      const exercises = await getExercises(
        routine.id,
      );

      if (exercises.length === 0) {
        setError(
          "Esta rutina no tiene ejercicios. Configurala antes de comenzar.",
        );
        return;
      }

      setActiveRoutineId(routine.id);
      setSelectedRoutine(routine);

      navigate(
        `/gimnasio/entrenamiento/${routine.id}`,
      );
    } catch (startError) {
      console.error(startError);
      setError(
        "No se pudo iniciar el entrenamiento.",
      );
    } finally {
      setWorkingId(null);
    }
  }

  function handleContinueWorkout() {
    if (!selectedRoutine) {
      return;
    }

    navigate(
      `/gimnasio/entrenamiento/${selectedRoutine.id}`,
    );
  }

  useEffect(() => {
    let cancelled = false;

    getRoutines()
      .then((savedRoutines) => {
        if (cancelled) {
          return;
        }

        setRoutines(savedRoutines);

        const activeRoutineId = getActiveRoutineId();
        const activeRoutine =
          savedRoutines.find(
            (routine) => routine.id === activeRoutineId,
          ) ?? null;

        setSelectedRoutine(activeRoutine);

        if (activeRoutineId && !activeRoutine) {
          clearActiveRoutineId();
        }
      })
      .catch((loadError: unknown) => {
        console.error(loadError);

        if (!cancelled) {
          setError("No se pudieron cargar las rutinas.");
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

  async function handleSubmit(data: RoutineFormData) {
    try {
      setSaving(true);
      setError("");

      if (routineToEdit) {
        await updateRoutine(routineToEdit.id, data);
      } else {
        await createRoutine(data);
      }

      await reloadRoutines();
      setRoutineToEdit(null);
      setShowForm(false);
    } catch (saveError) {
      console.error(saveError);
      setError("No se pudo guardar la rutina.");
      throw saveError;
    } finally {
      setSaving(false);
    }
  }

  async function runAction(
    routineId: string,
    action: () => Promise<void>,
    errorMessage: string,
  ) {
    try {
      setWorkingId(routineId);
      setError("");

      await action();
      await reloadRoutines();
    } catch (actionError) {
      console.error(actionError);
      setError(errorMessage);
    } finally {
      setWorkingId(null);
    }
  }

  async function handleDelete(routineId: string) {
    const confirmed = window.confirm(
      "¿Eliminar definitivamente esta rutina? Esta acción no se puede deshacer.",
    );

    if (!confirmed) {
      return;
    }

    await runAction(
      routineId,
      () => permanentlyDeleteRoutine(routineId),
      "No se pudo eliminar la rutina.",
    );
  }

  if (loading) {
    return (
      <p className="status-message">
        Cargando rutinas...
      </p>
    );
  }

  return (
    <section className="gym-page">
      <header className="module-header module-header--gym">
        <div>
          <p className="module-header__eyebrow module-header__eyebrow--gym">
            Entrenamiento
          </p>

          <h1>Gimnasio</h1>

          <p>
            Elegí una rutina y registrá tu entrenamiento.
          </p>
        </div>

        <button
          type="button"
          className="inline-add-button inline-add-button--gym"
          onClick={handleAdd}
          disabled={Boolean(selectedRoutine)}
        >
          + Agregar rutina
        </button>
      </header>

      {selectedRoutine && (
        <section className="active-workout-banner">
          <div>
            <span>Entrenamiento activo</span>
            <strong>{selectedRoutine.name}</strong>
          </div>

          <button
            type="button"
            className="continue-workout-button"
            onClick={handleContinueWorkout}
          >
            Continuar entrenamiento
          </button>
        </section>
      )}

      <div className="archive-toggle archive-toggle--gym">
        <button
          type="button"
          className={
            !showArchived
              ? "gym-tab gym-tab--active"
              : "gym-tab"
          }
          onClick={() => setShowArchived(false)}
        >
          Activas
        </button>

        <button
          type="button"
          className={
            showArchived
              ? "gym-tab gym-tab--active"
              : "gym-tab"
          }
          onClick={() => setShowArchived(true)}
        >
          Archivadas
        </button>
      </div>

      <RoutineList
        routines={routines}
        showArchived={showArchived}
        workingId={workingId}
        activeRoutineId={selectedRoutine?.id ?? null}
        editingRoutineId={routineToEdit?.id ?? null}
        onTrain={handleStartWorkout}
        onEdit={handleEdit}
        onArchive={(routineId) => {
          if (routineToEdit?.id === routineId) {
            setError(
              "Terminá o cancelá la edición antes de archivar.",
            );
            return Promise.resolve();
          }

          return runAction(
            routineId,
            () => archiveRoutine(routineId),
            "No se pudo archivar la rutina.",
          );
        }}
        onRestore={(routineId) =>
          runAction(
            routineId,
            () => restoreRoutine(routineId),
            "No se pudo restaurar la rutina.",
          )
        }
        onDelete={handleDelete}
      />

      {showForm && (
        <div
          ref={formContainerRef}
          className="item-form-container"
          key={
            routineToEdit?.id ??
            "new-routine-container"
          }
        >
          <RoutineForm
            key={routineToEdit?.id ?? "new-routine"}
            routineToEdit={routineToEdit}
            saving={saving}
            onSubmit={handleSubmit}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {error && <p className="form-error">{error}</p>}
    </section>
  );
}


