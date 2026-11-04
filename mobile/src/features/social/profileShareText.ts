import type { Profile } from "./api";
import { personName, visibleUsername } from "./display";

/** Never expose generated database handles in a message to another person. */
export function profileShareText(profile: Profile) {
  const name = personName(profile.display_name);
  const search = visibleUsername(profile.username) ?? name;
  return `Finn meg på VYRO: ${name}. Åpne Finn venner i VYRO og søk etter «${search}».`;
}
