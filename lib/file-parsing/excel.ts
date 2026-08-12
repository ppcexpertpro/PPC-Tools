import * as XLSX from "xlsx";
import type { ParsedFile } from "@/lib/file-parsing/csv";

export interface ParsedExcelFile extends ParsedFile {
  sheetName: string;
}

// PRD §5.3 assumption: v1 reads only the first sheet of multi-sheet files.
export async function parseExcel(file: File): Promise<ParsedExcelFile> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, {
    defval: "",
  });
  const [headerRow] = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
  });

  return {
    headers: (headerRow ?? []).map((cell) => String(cell)),
    rows,
    sheetName,
  };
}
