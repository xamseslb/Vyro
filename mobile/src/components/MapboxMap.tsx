import { useMemo } from "react";
import Mapbox from "@rnmapbox/maps";
import MapboxSurface from "./MapboxSurface";
import {
  emptyOverlays,
  emptyRoute,
  mapFeatures,
  type LiveMapProps,
} from "../features/maps/geometry";
import { heatmapCorners } from "../features/maps/mapboxNative";
import { useMapboxHeatmap } from "../features/maps/useMapboxHeatmap";

export default function MapboxMap({
  route = emptyRoute,
  overlays = emptyOverlays,
  heatmap,
  position,
  ...props
}: LiveMapProps & { onUnavailable: () => void }) {
  const heatmapUri = useMapboxHeatmap(heatmap?.uri, props.onUnavailable);
  const points = useMemo(
    () => [...route.flat(), ...overlays.flatMap((r) => r.points)],
    [route, overlays],
  );
  const features = useMemo(
    () => mapFeatures(heatmap ? [] : route, heatmap ? [] : overlays, position),
    [route, overlays, heatmap, position],
  );
  return (
    <MapboxSurface {...props} position={position} points={points}>
      {heatmap && heatmapUri && (
        <Mapbox.ImageSource
          id="football-density"
          url={heatmapUri}
          coordinates={heatmapCorners(heatmap)}
        >
          <Mapbox.RasterLayer
            id="football-density-image"
            slot="top"
            style={{ rasterOpacity: 0.85, rasterFadeDuration: 0 }}
          />
        </Mapbox.ImageSource>
      )}
      <Mapbox.ShapeSource id="workout" shape={features}>
        <Mapbox.LineLayer
          id="workout-outline"
          slot="top"
          filter={["==", ["geometry-type"], "LineString"]}
          style={{
            lineColor: "white",
            lineWidth: 8,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
        <Mapbox.LineLayer
          id="workout-line"
          slot="top"
          filter={["==", ["geometry-type"], "LineString"]}
          style={{
            lineColor: ["get", "color"],
            lineWidth: 4,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
        <Mapbox.CircleLayer
          id="workout-points"
          slot="top"
          filter={["==", ["geometry-type"], "Point"]}
          style={{
            circleColor: ["get", "color"],
            circleRadius: 6,
            circleStrokeWidth: 2,
            circleStrokeColor: "white",
          }}
        />
      </Mapbox.ShapeSource>
    </MapboxSurface>
  );
}
