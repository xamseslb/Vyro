import AppleMap from "./AppleMap";
import { MapProviderView } from "./MapProviderView";
import type { LiveMapProps } from "../features/maps/geometry";
export type { LiveMapProps } from "../features/maps/geometry";

export default function LiveMap(props: LiveMapProps) {
  return (
    <MapProviderView
      height={props.height}
      noticeBottom={props.attributionBottom}
      apple={<AppleMap {...props} />}
      mapbox={(onUnavailable) => {
        // Only load native code after checking that this build includes it.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const MapboxMap = require("./MapboxMap")
          .default as typeof import("./MapboxMap").default;
        return <MapboxMap {...props} onUnavailable={onUnavailable} />;
      }}
    />
  );
}
