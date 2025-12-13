export function getInitials(name: string): string {
  const trimmed = name.trim();

  if (!trimmed) {
    return "";
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean);

  if (tokens.length === 0) {
    return "";
  }

  if (tokens.length === 1) {
    const single = tokens[0] ?? "";
    return single.slice(0, 2).toUpperCase();
  }

  const first = tokens[0] ?? "";
  const last = tokens[tokens.length - 1] ?? "";

  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}
