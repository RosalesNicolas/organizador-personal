import {
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  parseStudentFile,
  type StudentImportResult,
} from "./studentImport";

type StudentImportProps = {
  importing: boolean;
  onConfirm: (
    result: StudentImportResult,
  ) => Promise<void>;
  onCancel: () => void;
};

export function StudentImport({
  importing,
  onConfirm,
  onCancel,
}: StudentImportProps) {
  const inputReference =
    useRef<HTMLInputElement | null>(null);

  const [selectedFileName, setSelectedFileName] =
    useState("");

  const [result, setResult] =
    useState<StudentImportResult | null>(null);

  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setReading(true);
      setError("");
      setResult(null);
      setSelectedFileName(file.name);

      const parsedResult =
        await parseStudentFile(file);

      setResult(parsedResult);
    } catch (fileError) {
      console.error(fileError);

      setError(
        fileError instanceof Error
          ? fileError.message
          : "No se pudo leer el archivo.",
      );
    } finally {
      setReading(false);
    }
  }

  function handleSelectAnotherFile() {
    setResult(null);
    setSelectedFileName("");
    setError("");

    if (inputReference.current) {
      inputReference.current.value = "";
      inputReference.current.click();
    }
  }

  async function handleConfirm() {
    if (!result || result.validRows.length === 0) {
      return;
    }

    await onConfirm(result);
  }

  return (
    <section className="student-import">
      <header className="student-import__header">
        <div>
          <h3>Importar estudiantes</h3>

          <p>
            El archivo debe incluir las columnas
            Apellidos y Nombre.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={onCancel}
          disabled={importing}
        >
          Cerrar
        </button>
      </header>

      <input
        ref={inputReference}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileChange}
        disabled={reading || importing}
      />

      {reading && (
        <p className="status-message">
          Leyendo archivo...
        </p>
      )}

      {selectedFileName && (
        <p className="student-import__filename">
          Archivo: {selectedFileName}
        </p>
      )}

      {result && (
        <>
          <section className="student-import__summary">
            <span>
              Válidos: {result.validRows.length}
            </span>

            <span>
              Con errores: {result.invalidRows.length}
            </span>
          </section>

          {result.validRows.length > 0 && (
            <div className="student-import__table-wrapper">
              <table className="student-import__table">
                <thead>
                  <tr>
                    <th>Fila</th>
                    <th>Apellidos</th>
                    <th>Nombre</th>
                    <th>Observación</th>
                  </tr>
                </thead>

                <tbody>
                  {result.validRows.map((student) => (
                    <tr key={student.sourceRow}>
                      <td>{student.sourceRow}</td>
                      <td>{student.lastName}</td>
                      <td>{student.firstName}</td>
                      <td>
                        {student.observation || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.invalidRows.length > 0 && (
            <section className="student-import__errors">
              <h4>Filas que no se importarán</h4>

              {result.invalidRows.map((invalidRow) => (
                <p key={invalidRow.sourceRow}>
                  Fila {invalidRow.sourceRow}:{" "}
                  {invalidRow.reason}
                </p>
              ))}
            </section>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={handleSelectAnotherFile}
              disabled={importing}
            >
              Elegir otro archivo
            </button>

            <button
              type="button"
              className="primary-button primary-button--piero"
              onClick={handleConfirm}
              disabled={
                importing ||
                result.validRows.length === 0
              }
            >
              {importing
                ? "Importando..."
                : `Importar ${result.validRows.length}`}
            </button>
          </div>
        </>
      )}

      {error && (
        <p className="form-error">{error}</p>
      )}
    </section>
  );
}
