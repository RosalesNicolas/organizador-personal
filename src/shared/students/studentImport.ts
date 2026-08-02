import * as XLSX from "xlsx";

export type ImportedStudentRow = {
  firstName: string;
  lastName: string;
  observation: string;
  sourceRow: number;
};

export type StudentImportResult = {
  validRows: ImportedStudentRow[];
  invalidRows: {
    sourceRow: number;
    reason: string;
  }[];
};

type SpreadsheetRow = Record<
  string,
  string | number | boolean | null | undefined
>;

function normalizeHeader(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[\s_-]+/g, "")
    .trim();
}

function normalizeCellValue(
  value: SpreadsheetRow[string],
) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

function findColumnValue(
  row: SpreadsheetRow,
  acceptedHeaders: string[],
) {
  const normalizedAcceptedHeaders =
    acceptedHeaders.map(normalizeHeader);

  const matchedEntry = Object.entries(row).find(
    ([header]) =>
      normalizedAcceptedHeaders.includes(
        normalizeHeader(header),
      ),
  );

  return normalizeCellValue(matchedEntry?.[1]);
}

export async function parseStudentFile(
  file: File,
): Promise<StudentImportResult> {
  const extension =
    file.name.split(".").pop()?.toLowerCase();

  if (
    extension !== "xlsx" &&
    extension !== "xls" &&
    extension !== "csv"
  ) {
    throw new Error(
      "El archivo debe ser XLSX, XLS o CSV.",
    );
  }

  const fileBuffer = await file.arrayBuffer();

  const workbook = XLSX.read(fileBuffer, {
    type: "array",
  });

  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new Error(
      "El archivo no contiene ninguna hoja.",
    );
  }

  const worksheet =
    workbook.Sheets[firstSheetName];

  const spreadsheetRows =
    XLSX.utils.sheet_to_json<SpreadsheetRow>(
      worksheet,
      {
        defval: "",
        raw: false,
      },
    );

  const validRows: ImportedStudentRow[] = [];
  const invalidRows: StudentImportResult["invalidRows"] =
    [];

  spreadsheetRows.forEach((row, index) => {
    const sourceRow = index + 2;

    const firstName = findColumnValue(row, [
      "nombre",
      "nombres",
      "firstname",
      "first name",
    ]);

    const lastName = findColumnValue(row, [
      "apellido",
      "apellidos",
      "lastname",
      "last name",
    ]);

    const observation = findColumnValue(row, [
      "observacion",
      "observación",
      "observaciones",
      "comentario",
      "comentarios",
    ]);

    if (!firstName && !lastName) {
      invalidRows.push({
        sourceRow,
        reason:
          "La fila no contiene nombre ni apellidos.",
      });

      return;
    }

    if (!firstName) {
      invalidRows.push({
        sourceRow,
        reason: "Falta el nombre.",
      });

      return;
    }

    if (!lastName) {
      invalidRows.push({
        sourceRow,
        reason: "Faltan los apellidos.",
      });

      return;
    }

    validRows.push({
      firstName,
      lastName,
      observation,
      sourceRow,
    });
  });

  return {
    validRows,
    invalidRows,
  };
}
