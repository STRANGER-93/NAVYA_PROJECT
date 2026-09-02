/** Calendar-only dates must not cross a timezone boundary during serialization. */
export function localCalendarDate(year: number, month: number, day: number) {
  return new Date(year, month, day, 12, 0, 0, 0);
}

export function localDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function localDateFromString(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return localCalendarDate(year, month - 1, day);
}
