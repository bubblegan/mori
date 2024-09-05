import dayjs from "dayjs";

export function convertToISO(date: Date) {
  return dayjs(date)
    .add((date.getTimezoneOffset() / 60) * -1, "hours")
    .toISOString();
}

export function convertToISOFromStr(date: string) {
  const parsedDate = dayjs(date, "YYYY-MM-DD");

  if (parsedDate.isValid()) {
    return parsedDate.add((parsedDate.toDate().getTimezoneOffset() / 60) * -1, "hours").toISOString();
  }

  return undefined;
}
