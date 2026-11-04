import { Share } from "react-native";
import type { Profile } from "./api";
import { profileShareText } from "./profileShareText";
export async function shareProfile(
  profile: Profile,
): Promise<"shared" | "copied" | "cancelled"> {
  const result = await Share.share({
    title: "Min VYRO-profil",
    message: profileShareText(profile),
  });
  return result.action === Share.dismissedAction ? "cancelled" : "shared";
}
