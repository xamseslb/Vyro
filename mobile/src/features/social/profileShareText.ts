import { message as uiText } from "../../i18n/language";
import type { Profile } from "./api";
import { personName, visibleUsername } from "./display";

/** Never expose generated database handles in a message to another person. */
export function profileShareText(profile: Profile) {
  const name = personName(profile.display_name);
  const search = visibleUsername(profile.username) ?? name;
  return uiText("Finn meg på VYRO: {0}. Åpne Finn venner i VYRO og søk etter «{1}».", name, search);
}
