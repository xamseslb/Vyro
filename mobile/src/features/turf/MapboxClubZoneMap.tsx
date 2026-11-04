import { useMemo } from "react";
import { Pressable } from "react-native";
import Mapbox from "@rnmapbox/maps";
import type { FeatureCollection, Geometry } from "geojson";
import MapboxSurface from "../../components/MapboxSurface";
import { coordinate } from "../maps/mapboxNative";
import { routeSegments } from "../tracking/gps";
import { personName } from "../social/display";
import { zoneShapes } from "./zoneGeometry";
import { ZonePin } from "./ZonePin";
import type { ClubZoneMapProps } from "./ClubZoneMap";
const padding = { top: 95, bottom: 190, left: 65, right: 65 };

export default function MapboxClubZoneMap({
  turfs,
  selected,
  onSelect,
  satellite,
  recenter,
  target,
  onUnavailable,
}: ClubZoneMapProps & { onUnavailable: () => void }) {
  const shapes = useMemo(() => zoneShapes(turfs), [turfs]);
  const points = useMemo(
    () => shapes.flatMap((shape) => shape.turf.route),
    [shapes],
  );
  const features = useMemo<FeatureCollection<Geometry>>(
    () => ({
      type: "FeatureCollection",
      features: shapes.flatMap((shape) => [
        {
          type: "Feature" as const,
          properties: { id: shape.turf.id, color: shape.color },
          geometry: {
            type: "Polygon" as const,
            coordinates: [[...shape.area, shape.area[0]].map(coordinate)],
          },
        },
        ...routeSegments(shape.turf.route)
          .filter((segment) => segment.length > 1)
          .map((segment) => ({
            type: "Feature" as const,
            properties: { id: shape.turf.id, color: shape.color },
            geometry: {
              type: "LineString" as const,
              coordinates: segment.map(coordinate),
            },
          })),
      ]),
    }),
    [shapes],
  );
  return (
    <MapboxSurface
      height={0}
      attributionBottom={190}
      padding={padding}
      mapKind={satellite ? "hybrid" : "standard"}
      poi={false}
      points={points}
      target={target}
      recenter={recenter}
      onUnavailable={onUnavailable}
    >
      <Mapbox.ShapeSource
        id="club-zones"
        shape={features}
        onPress={(event) => {
          const id = event.features[0]?.properties?.id;
          if (typeof id === "string") onSelect(id);
        }}
      >
        <Mapbox.FillLayer
          id="club-areas"
          slot="top"
          filter={["==", ["geometry-type"], "Polygon"]}
          style={{
            fillColor: ["get", "color"],
            fillOpacity: 0.22,
            fillOutlineColor: ["get", "color"],
          }}
        />
        <Mapbox.LineLayer
          id="club-routes"
          slot="top"
          filter={["==", ["geometry-type"], "LineString"]}
          style={{
            lineColor: ["get", "color"],
            lineWidth: ["case", ["==", ["get", "id"], selected ?? ""], 4, 2],
            lineCap: "round",
          }}
        />
      </Mapbox.ShapeSource>
      {shapes.map((shape) => (
        <Mapbox.MarkerView
          key={shape.turf.id}
          coordinate={coordinate(shape.anchor)}
          anchor={{ x: 0.5, y: 1 }}
          allowOverlap
          isSelected={shape.turf.id === selected}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Velg ${shape.turf.name}`}
            onPress={() => onSelect(shape.turf.id)}
          >
            <ZonePin
              name={personName(shape.turf.profiles?.display_name)}
              path={shape.turf.profiles?.avatar_path}
              color={shape.color}
              selected={shape.turf.id === selected}
            />
          </Pressable>
        </Mapbox.MarkerView>
      ))}
    </MapboxSurface>
  );
}
