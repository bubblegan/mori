export function completionToCategorise(completion: string) {
  const categorisedRecord: Record<string, string> = {};
  completion?.split("\n").forEach((line) => {
    const data = line.split(",");
    categorisedRecord[data[0]] = data[3];
  });
  return categorisedRecord;
}
