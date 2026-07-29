import { useState, type FormEvent } from "react";
import type {
  ExerciseFormData,
  GymExercise,
} from "./types";

type ExerciseFormProps = {
  exerciseToEdit: GymExercise | null;
  saving: boolean;
  onSubmit: (data: ExerciseFormData) => Promise<void>;
  onCancel: () => void;
};

function getInitialForm(
  exerciseToEdit: GymExercise | null,
): ExerciseFormData {
  if (!exerciseToEdit) {
    return {
      name: "",
      sets: 3,
      reps: 10,
      weight: 0,
      restSeconds: 60,
    };
  }

  return {
    name: exerciseToEdit.name,
    sets: exerciseToEdit.sets,
    reps: exerciseToEdit.reps,
    weight: exerciseToEdit.weight,
    restSeconds: exerciseToEdit.restSeconds,
  };
}

export function ExerciseForm({
  exerciseToEdit,
  saving,
  onSubmit,
  onCancel,
}: ExerciseFormProps) {
  const [formData, setFormData] = useState<ExerciseFormData>(() =>
    getInitialForm(exerciseToEdit),
  );
  const [validationError, setValidationError] = useState("");

  function updateTextField(
    field: "name",
    value: string,
  ) {
    setFormData((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function updateNumberField(
    field: Exclude<keyof ExerciseFormData, "name">,
    value: string,
  ) {
    setFormData((currentForm) => ({
      ...currentForm,
      [field]: Number(value),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.name.trim()) {
      setValidationError("El nombre es obligatorio.");
      return;
    }

    if (formData.sets < 1) {
      setValidationError("Debe haber al menos una serie.");
      return;
    }

    if (formData.reps < 1) {
      setValidationError("Debe haber al menos una repetición.");
      return;
    }

    if (formData.weight < 0 || formData.restSeconds < 0) {
      setValidationError(
        "El peso y el descanso no pueden ser negativos.",
      );
      return;
    }

    setValidationError("");
    await onSubmit(formData);
  }

  return (
    <form className="exercise-form" onSubmit={handleSubmit}>
      <h3>
        {exerciseToEdit ? "Editar ejercicio" : "Nuevo ejercicio"}
      </h3>

      <label className="form-field">
        <span>Nombre</span>
        <input
          type="text"
          value={formData.name}
          onChange={(event) =>
            updateTextField("name", event.target.value)
          }
          placeholder="Ej.: Curl con mancuernas"
        />
      </label>

      <div className="exercise-form__grid">
        <label className="form-field">
          <span>Series</span>
          <input
            type="number"
            min="1"
            value={formData.sets}
            onChange={(event) =>
              updateNumberField("sets", event.target.value)
            }
          />
        </label>

        <label className="form-field">
          <span>Repeticiones</span>
          <input
            type="number"
            min="1"
            value={formData.reps}
            onChange={(event) =>
              updateNumberField("reps", event.target.value)
            }
          />
        </label>

        <label className="form-field">
          <span>Peso (kg)</span>
          <input
            type="number"
            min="0"
            step="0.5"
            value={formData.weight}
            onChange={(event) =>
              updateNumberField("weight", event.target.value)
            }
          />
        </label>

        <label className="form-field">
          <span>Descanso (seg.)</span>
          <input
            type="number"
            min="0"
            step="5"
            value={formData.restSeconds}
            onChange={(event) =>
              updateNumberField(
                "restSeconds",
                event.target.value,
              )
            }
          />
        </label>
      </div>

      {validationError && (
        <p className="form-error">{validationError}</p>
      )}

      <div className="form-actions">
        <button
          type="submit"
          className="primary-button primary-button--gym"
          disabled={saving}
        >
          {saving
            ? "Guardando..."
            : exerciseToEdit
              ? "Guardar cambios"
              : "Crear ejercicio"}
        </button>

        <button
          type="button"
          className="secondary-button"
          disabled={saving}
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
