import type { GymExercise } from "./types";

type ExerciseListProps = {
  exercises: GymExercise[];
  workingId: string | null;
  editingExerciseId: string | null;
  locked: boolean;
  onEdit: (exercise: GymExercise) => void;
  onDelete: (exerciseId: string) => Promise<void>;
  onMoveUp: (exerciseId: string) => Promise<void>;
  onMoveDown: (exerciseId: string) => Promise<void>;
};

export function ExerciseList({
  exercises,
  workingId,
  editingExerciseId,
  locked,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
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
        const isEditing =
          editingExerciseId === exercise.id;

        const anotherExerciseIsEditing =
          editingExerciseId !== null &&
          editingExerciseId !== exercise.id;

        const actionsDisabled =
          isWorking ||
          locked ||
          isEditing ||
          anotherExerciseIsEditing;

        return (
          <article
            className={
              isEditing
                ? "exercise-card exercise-card--editing"
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
                  {exercise.sets} series ×{" "}
                  {exercise.reps} repeticiones
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
                <strong>
                  {exercise.restSeconds} s
                </strong>
              </div>
            </div>

            <div className="exercise-order-actions">
              <button
                type="button"
                className="action-button"
                disabled={
                  actionsDisabled || index === 0
                }
                onClick={() =>
                  void onMoveUp(exercise.id)
                }
              >
                ↑ Subir
              </button>

              <button
                type="button"
                className="action-button"
                disabled={
                  actionsDisabled ||
                  index === exercises.length - 1
                }
                onClick={() =>
                  void onMoveDown(exercise.id)
                }
              >
                ↓ Bajar
              </button>
            </div>

            <div className="routine-card__actions">
              <button
                type="button"
                className="action-button"
                disabled={actionsDisabled}
                onClick={() => onEdit(exercise)}
              >
                {isEditing ? "Editando" : "Editar"}
              </button>

              <button
                type="button"
                className="action-button action-button--danger"
                disabled={actionsDisabled}
                onClick={() =>
                  void onDelete(exercise.id)
                }
              >
                Eliminar
              </button>
            </div>

            {isEditing && (
              <p className="exercise-card__editing-message">
                Terminá o cancelá la edición para realizar otra acción.
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
