import * as XLSX from "xlsx";
import type { ParsedFile } from "@/lib/file-parsing/csv";

export interface ParsedExcelFile extends ParsedFile {
  sheetName: string;
  /** Every sheet in the workbook, so the user can switch to another one. */
  sheetNames: string[];
}

/**
 * Reads one sheet - the first unless `sheetName` is given. Cells come back as
 * text: numeric keywords ("2018", "101") would otherwise arrive as numbers and
 * break every caller that lowercases or trims them.
 */
export async function parseExcel(
  file: File,
  sheetName?: string,
): Promise<ParsedExcelFile> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const activeSheet =
    sheetName && workbook.SheetNames.includes(sheetName)
      ? sheetName
      : workbook.SheetNames[0];
  const sheet = workbook.Sheets[activeSheet];

  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: "",
    raw: false,
  });
  const [headerRow] = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
  });

  return {
    // Array.from fills the holes a blank header cell leaves in the row.
    headers: Array.from(headerRow ?? [], (cell) =>
      cell == null ? "" : String(cell),
    ),
    rows,
    sheetName: activeSheet,
    sheetNames: workbook.SheetNames,
  };
}
