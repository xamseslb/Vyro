import { message as uiText } from "../i18n/language";
import type { LiveMapProps } from "../features/maps/geometry";
import MapUnavailable from "./MapUnavailable";
export type { LiveMapProps } from "../features/maps/geometry";
export default function LiveMap(props: LiveMapProps) {
  return (
    <MapUnavailable
      height={props.height}
      message={uiText("VYRO utvikles for iPhone nå. Android-kart kommer senere.")}
    />
  );
}
