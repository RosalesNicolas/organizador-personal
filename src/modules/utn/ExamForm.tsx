import { useState, type FormEvent } from "react";
import type {
  ExamFormData,
  ExamStatus,
  UtnExam,
} from "./types";

type ExamFormProps = {
  examToEdit: UtnExam | null;
  saving: boolean;
  onSubmit: (data: ExamFormData) => Promise<void>;
  onCancelEdit: () => void;
};

function getInitialForm(examToEdit: UtnExam | null): ExamFormData {
  if (!examToEdit) {
    return {
      title: "",
      examDate: "",
      topicsText: "",
      notes: "",
      status: "proximo",
    };
  }

  return {
    title: examToEdit.title,
    examDate: examToEdit.examDate,
    topicsText: examToEdit.topics.join("\n"),
    notes: examToEdit.notes,
    status: examToEdit.status,
  };
}

export function ExamForm({
  examToEdit,
  saving,
  onSubmit,
  onCancelEdit,
}: ExamFormProps) {
  const [formData, setFormData] = useState<ExamFormData>(() =>
    getInitialForm(examToEdit),
  );
  const [validationError, setValidationError] = useState("");

  function updateField(field: keyof ExamFormData, value: string) {
    setFormData((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!formData.title.trim()) {
      setValidationError("El nombre del parcial es obligatorio.");
      return;
    }

    if (!formData.examDate) {
      setValidationError("La fecha del parcial es obligatoria.");
      return;
    }

    if (!formData.topicsText.trim()) {
      setValidationError("Agregá al menos un tema.");
      return;
    }

    setValidationError("");
    await onSubmit(formData);
  }

  return (
    <form className="exam-form" onSubmit={handleSubmit}>
      <h3>{examToEdit ? "Editar parcial" : "Nuevo parcial"}</h3>

      <label className="form-field">
        <span>Nombre</span>
        <input
          type="text"
          value={formData.title}
          onChange={(event) => updateField("title", event.target.value)}
          placeholder="Ej.: Primer parcial"
        />
      </label>

      <label className="form-field">
        <span>Fecha</span>
        <input
          type="date"
          value={formData.examDate}
          onChange={(event) => updateField("examDate", event.target.value)}
        />
      </label>

      <label className="form-field">
        <span>Temas — uno por línea</span>
        <textarea
          value={formData.topicsText}
          onChange={(event) =>
            updateField("topicsText", event.target.value)
          }
          placeholder={"Tema 1\nTema 2\nTema 3"}
          rows={5}
        />
      </label>

      <label className="form-field">
        <span>Notas</span>
        <textarea
          value={formData.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          placeholder="Información adicional, aula, modalidad..."
          rows={3}
        />
      </label>

      <label className="form-field">
        <span>Estado</span>
        <select
          value={formData.status}
          onChange={(event) =>
            updateField("status", event.target.value as ExamStatus)
          }
        >
          <option value="proximo">Próximo</option>
          <option value="rendido">Rendido</option>
          <option value="aprobado">Aprobado</option>
          <option value="desaprobado">Desaprobado</option>
          <option value="recuperatorio">Recuperatorio</option>
        </select>
      </label>

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
            : examToEdit
              ? "Guardar cambios"
              : "Crear parcial"}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={onCancelEdit}
          disabled={saving}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

