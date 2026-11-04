import type { CameraStop } from "@rnmapbox/maps";
import type { Coord } from "../tracking/gps";
import type { HeatmapOverlay } from "../football/heatmap";
import { createMapStyle, type MapKind } from "./config";

export const mapboxBasemap = (kind: MapKind) =>
  JSON.stringify({
    version: 8,
    imports: [
      {
        id: "basemap",
        url:
          kind === "standard"
            ? "mapbox://styles/mapbox/standard"
            : "mapbox://styles/mapbox/standard-satellite",
      },
    ],
    sources: {},
    layers: [],
  });

export function mapboxConfiguration(
  kind: MapKind,
  poi: boolean,
  threeD: boolean,
) {
  return createMapStyle(kind, poi, false, threeD).imports![0].config as Record<
    string,
    string | boolean
  >;
}

export const coordinate = (point: Coord): [number, number] => [
  point.longitude,
  point.latitude,
];
export function cameraFrame(
  points: readonly Coord[],
  focus?: Coord | null,
): CameraStop {
  if (focus) return { centerCoordinate: coordinate(focus), zoomLevel: 15.5 };
  if (!points.length)
    return { centerCoordinate: [10.7522, 59.9139], zoomLevel: 11 };
  let west = 180,
    east = -180,
    south = 90,
    north = -90;
  for (const point of points) {
    west = Math.min(west, point.longitude);
    east = Math.max(east, point.longitude);
    south = Math.min(south, point.latitude);
    north = Math.max(north, point.latitude);
  }
  if (east - west < 0.0001 && north - south < 0.0001)
    return { centerCoordinate: coordinate(points[0]), zoomLevel: 16 };
  return { bounds: { ne: [east, north], sw: [west, south] } };
}

export function heatmapCorners(
  heatmap: HeatmapOverlay,
): [[number, number], [number, number], [number, number], [number, number]] {
  const [[south, west], [north, east]] = heatmap.bounds;
  return [
    [west, north],
    [east, north],
    [east, south],
    [west, south],
  ];
}
