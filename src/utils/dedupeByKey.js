/**
 * Remove duplicate objects from array based on a key
 * Keeps the FIRST occurrence (important for finance consistency)
 */
export function dedupeByKey(array = [], key) {
  if (!Array.isArray(array)) return [];

  const seen = new Set();

  return array.filter(item => {
    const value = item?.[key];
    if (value === undefined || value === null) return false;

    if (seen.has(value)) return false;

    seen.add(value);
    return true;
  });
}
