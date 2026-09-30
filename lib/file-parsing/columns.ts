/**
 * Every non-empty cell of every column, read column by column - for a sheet
 * laid out as several side-by-side keyword lists rather than one column.
 */
export function allColumnValues(rows: Record<string, unknown>[]): string[] {
  const columns: string[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) columns.push(key);
    }
  }

  const values: string[] = [];
  for (const column of columns) {
    for (const row of rows) {
      const value = String(row[column] ?? "").trim();
      if (value) values.push(value);
    }
  }
  return values;
}
