// "YYYY-MM-DD" key of a date in the browser's local time zone (matches the backend's
// local-midnight days; never use toISOString, which is UTC — see CLAUDE.md pitfall #9)
export function localDayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
