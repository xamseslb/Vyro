import AppleClubZoneMap, { type ClubZoneMapProps } from "./AppleClubZoneMap";
import { MapProviderView } from "../../components/MapProviderView";
export type { ClubZoneMapProps } from "./ClubZoneMap";

export default function ClubZoneMap(props: ClubZoneMapProps) {
  return (
    <MapProviderView
      height={0}
      noticeBottom={190}
      apple={<AppleClubZoneMap {...props} />}
      mapbox={(onUnavailable) => {
        // Delay SDK evaluation until the installed native build is checked.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const MapboxClubZoneMap = require("./MapboxClubZoneMap")
          .default as typeof import("./MapboxClubZoneMap").default;
        return <MapboxClubZoneMap {...props} onUnavailable={onUnavailable} />;
      }}
    />
  );
}
