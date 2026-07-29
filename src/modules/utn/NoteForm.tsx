import { useState, type FormEvent } from "react";
import type {
  NoteFormData,
  NoteType,
  UtnNote,
} from "./types";

type NoteFormProps = {
  noteToEdit: UtnNote | null;
  saving: boolean;
  onSubmit: (data: NoteFormData) => Promise<void>;
  onCancel: () => void;
};

function getInitialForm(
  noteToEdit: UtnNote | null,
): NoteFormData {
  if (!noteToEdit) {
    return {
      title: "",
      content: "",
      type: "nota",
      dueDate: "",
    };
  }

  return {
    title: noteToEdit.title,
    content: noteToEdit.content,
    type: noteToEdit.type,
    dueDate: noteToEdit.dueDate,
  };
}

export function NoteForm({
  noteToEdit,
  saving,
  onSubmit,
  onCancel,
}: NoteFormProps) {
  const [formData, setFormData] = useState<NoteFormData>(() =>
    getInitialForm(noteToEdit),
  );
  const [validationError, setValidationError] = useState("");

  function updateField(
    field: keyof NoteFormData,
    value: string,
  ) {
    setFormData((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.title.trim()) {
      setValidationError("El título es obligatorio.");
      return;
    }

    if (!formData.content.trim()) {
      setValidationError("El contenido es obligatorio.");
      return;
    }

    setValidationError("");
    await onSubmit(formData);
  }

  return (
    <form className="note-form" onSubmit={handleSubmit}>
      <h3>{noteToEdit ? "Editar" : "Agregar"} nota o tarea</h3>

      <label className="form-field">
        <span>Tipo</span>

        <select
          value={formData.type}
          onChange={(event) =>
            updateField("type", event.target.value as NoteType)
          }
        >
          <option value="nota">Nota</option>
          <option value="tarea">Tarea</option>
        </select>
      </label>

      <label className="form-field">
        <span>Título</span>

        <input
          type="text"
          value={formData.title}
          onChange={(event) =>
            updateField("title", event.target.value)
          }
          placeholder="Ej.: Consultar al profesor"
        />
      </label>

      <label className="form-field">
        <span>Contenido</span>

        <textarea
          value={formData.content}
          onChange={(event) =>
            updateField("content", event.target.value)
          }
          placeholder="Escribí la información..."
          rows={5}
        />
      </label>

      {formData.type === "tarea" && (
        <label className="form-field">
          <span>Fecha opcional</span>

          <input
            type="date"
            value={formData.dueDate}
            onChange={(event) =>
              updateField("dueDate", event.target.value)
            }
          />
        </label>
      )}

      {validationError && (
        <p className="form-error">{validationError}</p>
      )}

      <div className="form-actions">
        <button
          type="submit"
          className="primary-button primary-button--utn"
          disabled={saving}
        >
          {saving
            ? "Guardando..."
            : noteToEdit
              ? "Guardar cambios"
              : "Guardar"}
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
