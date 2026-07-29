import { Link } from "react-router";
import type { GymRoutine } from "./types";

function formatLastWorkout(value: unknown) {
  if (
    !value ||
    typeof value !== "object" ||
    !("toDate" in value) ||
    typeof value.toDate !== "function"
  ) {
    return null;
  }

  const date = value.toDate();

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}
type RoutineListProps = {
  routines: GymRoutine[];
  showArchived: boolean;
  workingId: string | null;
  activeRoutineId: string | null;
  editingRoutineId: string | null;
  onTrain: (routine: GymRoutine) => void;
  onEdit: (routine: GymRoutine) => void;
  onArchive: (routineId: string) => Promise<void>;
  onRestore: (routineId: string) => Promise<void>;
  onDelete: (routineId: string) => Promise<void>;
};

export function RoutineList({
  routines,
  showArchived,
  workingId,
  activeRoutineId,
  editingRoutineId,
  onTrain,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}: RoutineListProps) {
  const visibleRoutines = routines.filter(
    (routine) => routine.archived === showArchived,
  );

  if (visibleRoutines.length === 0) {
    return (
      <section className="empty-state">
        <p>
          {showArchived
            ? "No hay rutinas archivadas."
            : "Todavía no hay rutinas creadas."}
        </p>
      </section>
    );
  }

  return (
    <section className="routine-list">
      {visibleRoutines.map((routine) => {
        const isWorking = workingId === routine.id;
        const isActive = activeRoutineId === routine.id;
        const isEditing = editingRoutineId === routine.id;
        const isLocked = isWorking || isActive || isEditing;

        return (
          <article
            className={
              isActive
                ? "routine-card routine-card--active"
                : isEditing
                  ? "routine-card routine-card--editing"
                  : "routine-card"
            }
            key={routine.id}
          >
            <div className="routine-card__content">
              <span className="routine-card__label">
                {isActive
                  ? "Entrenamiento activo"
                  : isEditing
                    ? "Edición en curso"
                    : "Rutina"}
              </span>

              <h2>{routine.name}</h2>

              {routine.description && <p>{routine.description}</p>}

              {formatLastWorkout(routine.lastCompletedAt) && (
                <p className="routine-card__last-workout">
                  Último realizado:{" "}
                  {formatLastWorkout(routine.lastCompletedAt)}
                </p>
              )}
            </div>

            {!routine.archived && (
              <button
                type="button"
                className="train-button"
                onClick={() => onTrain(routine)}
                disabled={isLocked}
              >
                {isActive
                  ? "Entrenamiento en curso"
                  : isEditing
                    ? "Edición en curso"
                    : "Comenzar entrenamiento"}
              </button>
            )}

            {!routine.archived &&
              (isActive ? (
                <button
                  type="button"
                  className="configure-routine-button"
                  disabled
                >
                  Configuración bloqueada
                </button>
              ) : (
                <Link
                  className="configure-routine-button"
                  to={`/gimnasio/${routine.id}`}
                >
                  Ver y configurar ejercicios
                </Link>
              ))}

            <div className="routine-card__actions">
              {!routine.archived ? (
                <>
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => onEdit(routine)}
                    disabled={isLocked}
                  >
                    Editar
                  </button>

                  <button
                    type="button"
                    className="action-button"
                    onClick={() => void onArchive(routine.id)}
                    disabled={isLocked}
                  >
                    Archivar
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="action-button"
                    onClick={() => void onRestore(routine.id)}
                    disabled={isWorking}
                  >
                    Restaurar
                  </button>

                  <button
                    type="button"
                    className="action-button action-button--danger"
                    onClick={() => void onDelete(routine.id)}
                    disabled={isWorking}
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>

            {isActive && (
              <p className="routine-card__active-warning">
                Cerrá el entrenamiento para editar o configurar esta rutina.
              </p>
            )}

            {isEditing && (
              <p className="routine-card__editing-warning">
                Terminá o cancelá la edición antes de usar esta rutina.
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}


