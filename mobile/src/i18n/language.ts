import en from "./en.json";
export type AppLanguage = "nb" | "en";
let current: AppLanguage = "nb";
export const setDisplayLanguage = (language: AppLanguage) => { current = language; };
export const displayLanguage = (): AppLanguage => current;
export const displayLocale = () => current === "en" ? "en-GB" : "nb-NO";
const english: Readonly<Record<string, string>> = en;
// Call only for app-owned copy; arguments may contain names, notes or other user content.
export function message(source: string, ...args: unknown[]): string {
  const template = current === "en" ? english[source] ?? source : source;
  return args.length ? template.replace(/\{(\d+)\}/g, (marker, i: string) => Number(i) < args.length ? String(args[Number(i)]) : marker) : template;
}
