import * as XLSX from "xlsx";
import { parseExcel } from "@/lib/file-parsing/excel";

function createXlsxFile(
  sheets: Array<{ name: string; rows: unknown[][] }>,
): File {
  const workbook = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const worksheet = XLSX.utils.aoa_to_sheet(sheet.rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
  }
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  return new File([buffer], "report.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

describe("parseExcel", () => {
  it("reads headers and rows from the first sheet", async () => {
    const file = createXlsxFile([
      {
        name: "Sheet1",
        rows: [
          ["Search Term", "Clicks"],
          ["running shoes", 10],
          ["hiking boots", 5],
        ],
      },
    ]);

    const result = await parseExcel(file);

    expect(result.headers).toEqual(["Search Term", "Clicks"]);
    expect(result.sheetName).toBe("Sheet1");
    expect(result.rows).toEqual([
      { "Search Term": "running shoes", Clicks: 10 },
      { "Search Term": "hiking boots", Clicks: 5 },
    ]);
  });

  it("only reads the first sheet when multiple sheets exist (PRD §5.3 assumption)", async () => {
    const file = createXlsxFile([
      { name: "First", rows: [["Search Term"], ["shoes"]] },
      { name: "Second", rows: [["Other"], ["ignored"]] },
    ]);

    const result = await parseExcel(file);

    expect(result.sheetName).toBe("First");
    expect(result.headers).toEqual(["Search Term"]);
    expect(result.rows).toEqual([{ "Search Term": "shoes" }]);
  });
});
