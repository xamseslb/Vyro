/** Generated handles remain valid for links/search, but aren't useful display names. */
export function isGeneratedUsername(value: string) {
  return /^@?runner_[a-f0-9-]{24,}$/i.test(value.trim());
}
export function visibleUsername(username?: string): string | null {
  return !username?.trim() || isGeneratedUsername(username)
    ? null
    : `@${username.replace(/^@/, "")}`;
}
export function personName(name?: string | null) {
  return name?.trim() && !isGeneratedUsername(name)
    ? name.trim()
    : "VYRO-bruker";
}
