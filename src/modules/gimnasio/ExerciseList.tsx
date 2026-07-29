import type { GymExercise } from "./types";

type ExerciseListProps = {
  exercises: GymExercise[];
  workingId: string | null;
  locked: boolean;
  onEdit: (exercise: GymExercise) => void;
  onDelete: (exerciseId: string) => Promise<void>;
};

export function ExerciseList({
  exercises,
  workingId,
  locked,
  onEdit,
  onDelete,
}: ExerciseListProps) {
  if (exercises.length === 0) {
    return (
      <section className="empty-state">
        <p>Todavía no hay ejercicios en esta rutina.</p>
      </section>
    );
  }

  return (
    <section className="exercise-list">
      {exercises.map((exercise, index) => {
        const isWorking = workingId === exercise.id;
        const actionsDisabled = isWorking || locked;

        return (
          <article
            className={
              locked
                ? "exercise-card exercise-card--locked"
                : "exercise-card"
            }
            key={exercise.id}
          >
            <div className="exercise-card__header">
              <span className="exercise-card__order">
                {index + 1}
              </span>

              <div>
                <h2>{exercise.name}</h2>
                <p>
                  {exercise.sets} series × {exercise.reps} repeticiones
                </p>
              </div>
            </div>

            <div className="exercise-card__data">
              <div>
                <span>Peso</span>
                <strong>{exercise.weight} kg</strong>
              </div>

              <div>
                <span>Descanso</span>
                <strong>{exercise.restSeconds} s</strong>
              </div>
            </div>

            <div className="routine-card__actions">
              <button
                type="button"
                className="action-button"
                disabled={actionsDisabled}
                onClick={() => onEdit(exercise)}
              >
                Editar
              </button>

              <button
                type="button"
                className="action-button action-button--danger"
                disabled={actionsDisabled}
                onClick={() => void onDelete(exercise.id)}
              >
                Eliminar
              </button>
            </div>

            {locked && (
              <p className="exercise-card__locked-message">
                Este ejercicio no puede modificarse durante el entrenamiento.
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
