export function getDescribedBy({
  error,
  hint,
  id,
}: {
  error?: unknown;
  hint?: unknown;
  id: string;
}) {
  if (error) {
    return `${id}-error`;
  }

  if (hint) {
    return `${id}-hint`;
  }

  return undefined;
}
