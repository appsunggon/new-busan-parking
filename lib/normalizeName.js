export function normalizeName(name = "") {
  return String(name)
    .replace(/\s+/g, "")
    .replace(/공영주차장/g, "")
    .replace(/공영/g, "")
    .replace(/도시철도/g, "")
    .replace(/[(),]/g, "")
    .toLowerCase();
}