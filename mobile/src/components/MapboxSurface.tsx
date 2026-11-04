import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type ComponentRef,
} from "react";
import { View } from "react-native";
import Mapbox, { type CameraStop } from "@rnmapbox/maps";
import { mapboxToken } from "../features/maps/config";
import {
  cameraFrame,
  coordinate,
  mapboxBasemap,
  mapboxConfiguration,
} from "../features/maps/mapboxNative";
import type { Coord } from "../features/tracking/gps";

// Use the existing Expo Location fixes, never a second native location watcher.
// No telemetry location collection. Required Mapbox logo/attribution remain visible.
Mapbox.setTelemetryEnabled(false);
const tokenReady = Mapbox.setAccessToken(mapboxToken);
const defaultPadding = { top: 40, bottom: 40, left: 40, right: 40 };
const noPoints: Coord[] = [];

export default function MapboxSurface({
  children,
  height = 300,
  attributionBottom = 0,
  mapKind = "standard",
  poi = true,
  threeD = false,
  contours = false,
  north = 0,
  target = null,
  position = null,
  follow = false,
  recenter = 0,
  points = noPoints,
  padding = defaultPadding,
  onPan,
  onUnavailable,
}: {
  children?: ReactNode;
  points?: Coord[];
  onUnavailable: () => void;
} & Omit<
  import("../features/maps/geometry").LiveMapProps,
  "route" | "overlays" | "heatmap"
>) {
  const camera = useRef<ComponentRef<typeof Mapbox.Camera>>(null);
  const [configured, setConfigured] = useState(false);
  const [ready, setReady] = useState(false);
  const panned = useRef(false);
  const failed = useRef(false);
  const failure = useRef(onUnavailable);
  useEffect(() => {
    failure.current = onUnavailable;
  }, [onUnavailable]);
  const fail = () => {
    if (!failed.current) {
      failed.current = true;
      failure.current();
    }
  };
  const failRef = useRef(fail);
  const imagery = mapKind !== "standard";
  const style = useMemo(
    () => mapboxBasemap(imagery ? "hybrid" : "standard"),
    [imagery],
  );
  const config = useMemo(
    () => mapboxConfiguration(mapKind, poi, threeD),
    [mapKind, poi, threeD],
  );
  const cameraPadding = useMemo(
    () => ({
      paddingTop: padding.top,
      paddingBottom: padding.bottom,
      paddingLeft: padding.left,
      paddingRight: padding.right,
    }),
    [padding.top, padding.bottom, padding.left, padding.right],
  );
  const focus = follow ? position : null;
  const frame = useMemo(() => cameraFrame(points, target), [points, target]);
  const frameKey = JSON.stringify(frame);
  const targetKey = target ? `${target.latitude}:${target.longitude}` : "";
  const paddingKey = JSON.stringify(cameraPadding);
  const [initial] = useState(() => ({
    ...cameraFrame(points, focus ?? target),
    pitch: threeD ? 55 : 0,
    heading: 0,
  }));
  const previous = useRef({
    ready: false,
    follow,
    recenter,
    targetKey,
    frameKey,
    paddingKey,
    north,
    threeD,
    focus,
  });
  useEffect(() => {
    let alive = true;
    void tokenReady
      .then(() => {
        if (alive) setConfigured(true);
      })
      .catch(() => {
        if (alive) failRef.current();
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (ready) return;
    const timer = setTimeout(() => failRef.current(), 20000);
    return () => clearTimeout(timer);
  }, [ready]);

  useEffect(() => {
    if (!ready || !camera.current) return;
    const last = previous.current;
    const reset =
      !last.ready ||
      recenter !== last.recenter ||
      targetKey !== last.targetKey ||
      (follow && !last.follow) ||
      (!!focus && !last.focus);
    const moved =
      focus?.latitude !== last.focus?.latitude ||
      focus?.longitude !== last.focus?.longitude;
    const reframed =
      frameKey !== last.frameKey || paddingKey !== last.paddingKey;
    const oriented =
      !last.ready || north !== last.north || threeD !== last.threeD;
    previous.current = {
      ready,
      follow,
      recenter,
      targetKey,
      frameKey,
      paddingKey,
      north,
      threeD,
      focus,
    };
    if (reset) panned.current = false;
    const reposition = !panned.current && (reset || (focus ? moved : reframed));
    if (!reposition && !oriented) return;
    const next: CameraStop = {
      animationDuration: 250,
      animationMode: "easeTo",
    };
    if (reposition) {
      if (focus)
        Object.assign(next, {
          centerCoordinate: coordinate(focus),
          ...(reset ? { zoomLevel: 15.5 } : {}),
        });
      else Object.assign(next, frame, { padding: cameraPadding });
    }
    // Pitch and heading only: never fit/reset zoom on 2D/3D or style changes.
    if (oriented) next.pitch = threeD ? 55 : 0;
    if (!last.ready || north !== last.north) next.heading = 0;
    camera.current.setCamera(next);
  }, [
    ready,
    follow,
    recenter,
    targetKey,
    frameKey,
    paddingKey,
    north,
    threeD,
    focus,
    frame,
    cameraPadding,
  ]);

  if (!configured)
    return <View style={height === 0 ? { flex: 1 } : { height }} />;
  return (
    <Mapbox.MapView
      testID="mapbox-map"
      style={height === 0 ? { flex: 1 } : { height, width: "100%" }}
      styleJSON={style}
      projection="mercator"
      scaleBarEnabled={false}
      compassEnabled={false}
      pitchEnabled={threeD}
      logoEnabled
      attributionEnabled
      logoPosition={{ left: 8, bottom: attributionBottom + 8 }}
      attributionPosition={{ right: 8, bottom: attributionBottom + 8 }}
      onDidFinishLoadingStyle={() => setReady(true)}
      onMapLoadingError={fail}
    >
      <Mapbox.Camera
        ref={camera}
        defaultSettings={initial}
        padding={cameraPadding}
        maxZoomLevel={20}
        minZoomLevel={2}
      />
      <Mapbox.CameraGestureObserver
        onCameraChanged={({ nativeEvent }) => {
          if (nativeEvent.properties.isUserInteraction) {
            panned.current = !follow || !!onPan;
            onPan?.();
          }
        }}
      />
      <Mapbox.StyleImport id="basemap" existing config={config} />
      {contours && (
        <Mapbox.VectorSource
          id="contours"
          url="mapbox://mapbox.mapbox-terrain-v2"
        >
          <Mapbox.LineLayer
            id="contour-lines"
            sourceLayerID="contour"
            slot="middle"
            minZoomLevel={12}
            style={{ lineColor: "#8C8466", lineWidth: 0.7, lineOpacity: 0.4 }}
          />
        </Mapbox.VectorSource>
      )}
      {threeD && (
        <Mapbox.RasterDemSource
          id="terrain"
          url="mapbox://mapbox.mapbox-terrain-dem-v1"
          tileSize={512}
          maxZoomLevel={14}
        >
          <Mapbox.Terrain style={{ exaggeration: 1 }} />
        </Mapbox.RasterDemSource>
      )}
      {children}
    </Mapbox.MapView>
  );
}
