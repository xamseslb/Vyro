import type { ImageSourcePropType } from "react-native";
import type { SelectableSport, Sport } from "./sports";

// Original Magnific / Flaticon artwork, bundled for offline use.
// Credits: Settings → Help and about VYRO. Sources: assets/sports/flaticon/sources.json.
// Static requires let Metro include every image in native and web exports.
const running = require("../../../assets/sports/flaticon/running_2000047.png");
const cycling = require("../../../assets/sports/flaticon/cycling_2000140.png");
const skis = require("../../../assets/sports/flaticon/ski_3969648.png");
const kayak = require("../../../assets/sports/flaticon/kayak_805490.png");

const artwork: Record<SelectableSport, ImageSourcePropType> = {
  Løping: running,
  Terrengløping: running,
  Gange: require("../../../assets/sports/flaticon/walking_2000197.png"),
  Fottur: require("../../../assets/sports/flaticon/hiking_805484.png"),
  Sykling: cycling,
  Terrengsykling: cycling,
  Gravelsykling: cycling,
  Elsykkel: cycling,
  Langrenn: skis,
  Alpint: require("../../../assets/sports/flaticon/skiing_805505.png"),
  Fotball: require("../../../assets/sports/material-design/soccer.png"),
  Svømming: require("../../../assets/sports/flaticon/swimmer_2000149.png"),
  Kajakk: kayak,
  Roing: require("../../../assets/sports/flaticon/rowing_2119046.png"),
  Padling: kayak,
  Rulleski: skis,
  Styrketrening: require("../../../assets/sports/flaticon/dumbbell_2000054.png"),
  Trappemaskin: require("../../../assets/sports/material-design/stairs-up.png"),
};

// Retired sports remain readable in historical workouts using the existing symbol.
export function sportArtwork(sport: Sport): ImageSourcePropType | undefined {
  return (artwork as Partial<Record<Sport, ImageSourcePropType>>)[sport];
}
