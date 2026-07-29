import { useState, type FormEvent } from "react";
import type {
  GymRoutine,
  RoutineFormData,
} from "./types";

type RoutineFormProps = {
  routineToEdit: GymRoutine | null;
  saving: boolean;
  onSubmit: (data: RoutineFormData) => Promise<void>;
  onCancel: () => void;
};

function getInitialForm(
  routineToEdit: GymRoutine | null,
): RoutineFormData {
  if (!routineToEdit) {
    return {
      name: "",
      description: "",
    };
  }

  return {
    name: routineToEdit.name,
    description: routineToEdit.description,
  };
}

export function RoutineForm({
  routineToEdit,
  saving,
  onSubmit,
  onCancel,
}: RoutineFormProps) {
  const [formData, setFormData] = useState<RoutineFormData>(() =>
    getInitialForm(routineToEdit),
  );
  const [validationError, setValidationError] = useState("");

  function updateField(
    field: keyof RoutineFormData,
    value: string,
  ) {
    setFormData((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.name.trim()) {
      setValidationError("El nombre de la rutina es obligatorio.");
      return;
    }

    setValidationError("");
    await onSubmit(formData);
  }

  return (
    <form className="routine-form" onSubmit={handleSubmit}>
      <h3>
        {routineToEdit ? "Editar rutina" : "Nueva rutina"}
      </h3>

      <label className="form-field">
        <span>Nombre</span>

        <input
          type="text"
          value={formData.name}
          onChange={(event) =>
            updateField("name", event.target.value)
          }
          placeholder="Ej.: Pecho y tríceps"
        />
      </label>

      <label className="form-field">
        <span>Descripción opcional</span>

        <textarea
          value={formData.description}
          onChange={(event) =>
            updateField("description", event.target.value)
          }
          placeholder="Objetivo o indicaciones generales..."
          rows={4}
        />
      </label>

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
            : routineToEdit
              ? "Guardar cambios"
              : "Crear rutina"}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
          disabled={saving}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
