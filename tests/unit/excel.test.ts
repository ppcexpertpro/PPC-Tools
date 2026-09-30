import * as XLSX from "xlsx";
import { allColumnValues } from "@/lib/file-parsing/columns";
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
      { "Search Term": "running shoes", Clicks: "10" },
      { "Search Term": "hiking boots", Clicks: "5" },
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

  it("lists every sheet name so the user can pick another sheet", async () => {
    const file = createXlsxFile([
      { name: "First", rows: [["Search Term"], ["shoes"]] },
      { name: "Second", rows: [["Other"], ["kept"]] },
    ]);

    const result = await parseExcel(file);

    expect(result.sheetNames).toEqual(["First", "Second"]);
  });

  it("reads the named sheet when one is given", async () => {
    const file = createXlsxFile([
      { name: "First", rows: [["Search Term"], ["shoes"]] },
      { name: "Second", rows: [["Negative Keywords"], ["salary"], [2018]] },
    ]);

    const result = await parseExcel(file, "Second");

    expect(result.sheetName).toBe("Second");
    expect(result.headers).toEqual(["Negative Keywords"]);
    // Numeric cells (years, "101") come back as text - callers lowercase them.
    expect(result.rows).toEqual([
      { "Negative Keywords": "salary" },
      { "Negative Keywords": "2018" },
    ]);
  });
});

describe("allColumnValues", () => {
  it("collects every non-empty cell, column by column", () => {
    expect(
      allColumnValues([
        { General: "club", Adult: "xxx" },
        { General: "clubs", Adult: "" },
        { General: "", Adult: "nude" },
      ]),
    ).toEqual(["club", "clubs", "xxx", "nude"]);
  });
});
