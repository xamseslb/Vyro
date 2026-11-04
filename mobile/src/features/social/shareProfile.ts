import type { Profile } from "./api";
import { profileShareText } from "./profileShareText";
export { profileShareText } from "./profileShareText";
export async function shareProfile(
  profile: Profile,
): Promise<"shared" | "copied" | "cancelled"> {
  const text = profileShareText(profile);
  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share({ title: "Min VYRO-profil", text });
      return "shared";
    } catch (e) {
      if ((e as Error).name === "AbortError") return "cancelled";
      throw e;
    }
  }
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    await navigator.clipboard.writeText(text);
    return "copied";
  }
  throw new Error(
    "Deling er ikke tilgjengelig her. Du kan dele brukernavnet ditt manuelt.",
  );
}
