import { message as uiText } from "../../i18n/language";
export function normalizeUsername(value: string) {
  return value.trim().replace(/^@/, "").toLowerCase();
}

export function usernameProblem(value: string) {
  if (!/^[a-z0-9_]{3,24}$/.test(value))
    return uiText("Bruk 3–24 små bokstaver (a–z), tall eller understrek.");
  if (value.startsWith("runner_"))
    return uiText("Velg et navn som ikke starter med runner_.");
}
export const usernameTaken = "Det brukernavnet er opptatt. Prøv et annet.";
