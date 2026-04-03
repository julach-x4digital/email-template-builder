/** Stable unique ids for nodes in the template tree. */
export function newId(): string {
  return crypto.randomUUID()
}
