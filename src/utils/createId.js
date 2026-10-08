// Creates a short, unique id like "m1x9k2ab3f7q".
// Combines the current time with a random part, so two ids
// made at the same moment are still different.

export function createId() {
  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 8);
  return timePart + randomPart;
}