import type { ImageSourcePropType } from "react-native";
import type { SelectableSport, Sport } from "./sports";

// Original Magnific / Flaticon artwork, bundled for offline use.
// Credits: Settings → Help and about VYRO. Sources: assets/sports/flaticon/sources.json.
// Static requires let Metro include every image in native and web exports.
const running = require("../../../assets/sports/flaticon/running_2000047.png");
const cycling = require("../../../assets/sports/flaticon/cycling_2000140.png");
const mountainBike = require("../../../assets/sports/flaticon/mountain-bike_3253157.png");
const skis = require("../../../assets/sports/flaticon/ski_3969648.png");
const kayak = require("../../../assets/sports/flaticon/kayak_805490.png");

const artwork: Record<SelectableSport, ImageSourcePropType> = {
  Løping: running,
  Terrengløping: running,
  Gange: require("../../../assets/sports/flaticon/walking_2000197.png"),
  Fottur: require("../../../assets/sports/flaticon/hiking_805484.png"),
  Sykling: cycling,
  Terrengsykling: mountainBike,
  Gravelsykling: mountainBike,
  Elsykkel: cycling,
  Langrenn: skis,
  Alpint: require("../../../assets/sports/flaticon/skiing_805505.png"),
  Truger: require("../../../assets/sports/flaticon/snowshoe_9007233.png"),
  Fotball: require("../../../assets/sports/flaticon/soccer_2000113.png"),
  Svømming: require("../../../assets/sports/flaticon/swimmer_2000149.png"),
  Kajakk: kayak,
  Roing: require("../../../assets/sports/flaticon/rowing_2119046.png"),
  Padling: kayak,
  Rulleskøyter: require("../../../assets/sports/flaticon/roller-skate_2000155.png"),
  Rulleski: skis,
  Klatring: require("../../../assets/sports/flaticon/climbing_805512.png"),
  Styrketrening: require("../../../assets/sports/flaticon/dumbbell_2000054.png"),
  Trappemaskin: require("../../../assets/sports/flaticon/stairs_9436103.png"),
  Pilates: require("../../../assets/sports/flaticon/pilates_6233472.png"),
};

// Retired sports remain readable in historical workouts using the existing symbol.
export function sportArtwork(sport: Sport): ImageSourcePropType | undefined {
  return (artwork as Partial<Record<Sport, ImageSourcePropType>>)[sport];
}
