import { act, fireEvent, render, screen } from "@testing-library/react-native";
import MapboxSurface from "../src/components/MapboxSurface";
import MapboxMap from "../src/components/MapboxMap";
import MapboxClubZoneMap from "../src/features/turf/MapboxClubZoneMap";
import {
  cameraFrame,
  heatmapCorners,
  mapboxBasemap,
  mapboxConfiguration,
} from "../src/features/maps/mapboxNative";

const mockCamera = jest.fn();
let mockGesture: any;
jest.mock("../src/features/turf/ZonePin", () => ({ ZonePin: () => null }));
jest.mock("../src/features/maps/useMapboxHeatmap", () => ({
  useMapboxHeatmap: () => null,
}));
jest.mock("@rnmapbox/maps", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    __esModule: true,
    default: {
      setTelemetryEnabled: jest.fn(),
      setAccessToken: jest.fn().mockResolvedValue(null),
      MapView: (props: any) => <View {...props} />,
      Camera: React.forwardRef((_: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({ setCamera: mockCamera }));
        return null;
      }),
      CameraGestureObserver: (props: any) => {
        mockGesture = props.onCameraChanged;
        return null;
      },
      StyleImport: (props: any) => <View testID="map-style" {...props} />,
      VectorSource: View,
      RasterDemSource: View,
      Terrain: View,
      MarkerView: View,
      ShapeSource: (props: any) => <View testID="map-shape" {...props} />,
      ImageSource: View,
      LineLayer: View,
      FillLayer: View,
      CircleLayer: View,
      RasterLayer: View,
    },
  };
});
const start = { latitude: 59.9, longitude: 10.7 };
const end = { latitude: 59.91, longitude: 10.71 };
const points = [start, end];
beforeEach(() => {
  mockCamera.mockClear();
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());
async function ready() {
  await act(async () => {
    screen.getByTestId("mapbox-map").props.onDidFinishLoadingStyle();
  });
  mockCamera.mockClear();
}

test("repeated 2D/3D and satellite/hybrid changes never fit or reset zoom", async () => {
  const fail = jest.fn();
  await render(<MapboxSurface points={points} onUnavailable={fail} />);
  await ready();
  for (const threeD of [true, false, true, false]) {
    await screen.rerender(
      <MapboxSurface points={points} threeD={threeD} onUnavailable={fail} />,
    );
    expect(mockCamera.mock.lastCall![0]).toEqual({
      pitch: threeD ? 55 : 0,
      animationMode: "easeTo",
      animationDuration: 250,
    });
  }
  mockCamera.mockClear();
  await screen.rerender(
    <MapboxSurface points={points} mapKind="satellite" onUnavailable={fail} />,
  );
  await act(async () =>
    screen.getByTestId("mapbox-map").props.onDidFinishLoadingStyle(),
  );
  const imagery = screen.getByTestId("mapbox-map").props.styleJSON;
  expect(screen.getByTestId("map-style").props.config.showRoadLabels).toBe(
    false,
  );
  await screen.rerender(
    <MapboxSurface points={points} mapKind="hybrid" onUnavailable={fail} />,
  );
  expect(screen.getByTestId("mapbox-map").props.styleJSON).toBe(imagery);
  expect(screen.getByTestId("map-style").props.config.showRoadLabels).toBe(
    true,
  );
  expect(mockCamera).not.toHaveBeenCalled();
});

test("GPS follow moves the center without changing user zoom; pan suspends it until recenter", async () => {
  const fail = jest.fn(),
    pan = jest.fn();
  await render(
    <MapboxSurface
      points={points}
      follow
      position={start}
      onPan={pan}
      onUnavailable={fail}
    />,
  );
  await ready();
  await screen.rerender(
    <MapboxSurface
      points={points}
      follow
      position={end}
      onPan={pan}
      onUnavailable={fail}
    />,
  );
  expect(mockCamera.mock.lastCall![0].centerCoordinate).toEqual([10.71, 59.91]);
  expect(mockCamera.mock.lastCall![0].zoomLevel).toBeUndefined();
  mockCamera.mockClear();
  await act(async () =>
    mockGesture({ nativeEvent: { properties: { isUserInteraction: true } } }),
  );
  expect(pan).toHaveBeenCalledTimes(1);
  await screen.rerender(
    <MapboxSurface
      points={points}
      follow
      position={start}
      onPan={pan}
      onUnavailable={fail}
    />,
  );
  expect(mockCamera).not.toHaveBeenCalled();
  await screen.rerender(
    <MapboxSurface
      points={points}
      follow
      position={start}
      recenter={1}
      onPan={pan}
      onUnavailable={fail}
    />,
  );
  expect(mockCamera.mock.lastCall![0].centerCoordinate).toEqual([10.7, 59.9]);
});

test("native tile failures fall back once, and an unresponsive style cannot remain blank", async () => {
  const fail = jest.fn();
  await render(<MapboxSurface onUnavailable={fail} />);
  await act(async () => {
    screen
      .getByTestId("mapbox-map")
      .props.onMapLoadingError({ type: "tile", message: "429" });
    screen.getByTestId("mapbox-map").props.onMapLoadingError({ type: "tile" });
    jest.advanceTimersByTime(20000);
  });
  expect(fail).toHaveBeenCalledTimes(1);
  await screen.unmount();
  fail.mockClear();
  await render(<MapboxSurface onUnavailable={fail} />);
  await act(async () => jest.advanceTimersByTime(20000));
  expect(fail).toHaveBeenCalledTimes(1);
});

test("recorded and shared pause gaps remain separate lines with the real GPS marker", async () => {
  const far = { latitude: 60, longitude: 11, breakBefore: true };
  const farther = { latitude: 60.01, longitude: 11.01 };
  await render(
    <MapboxMap
      route={[
        [start, end],
        [far, farther],
      ]}
      overlays={[
        {
          id: "shared",
          owner: "Løper",
          name: "Tur",
          color: "red",
          points: [start, end, far, farther],
        },
      ]}
      position={end}
      onUnavailable={jest.fn()}
    />,
  );
  const { features } = screen.getByTestId("map-shape").props.shape;
  const lines = features.filter((f: any) => f.geometry.type === "LineString");
  expect(lines).toHaveLength(4);
  expect(lines.every((f: any) => f.geometry.coordinates.length === 2)).toBe(
    true,
  );
  expect(
    features.find((f: any) => f.properties.kind === "position").geometry
      .coordinates,
  ).toEqual([10.71, 59.91]);
});

test("bounds, photographic styles and heatmap orientation match native longitude/latitude coordinates", () => {
  expect(cameraFrame(points)).toEqual({
    bounds: { sw: [10.7, 59.9], ne: [10.71, 59.91] },
  });
  expect(cameraFrame(points, end).centerCoordinate).toEqual([10.71, 59.91]);
  expect(
    heatmapCorners({
      uri: "",
      bounds: [
        [59, 10],
        [60, 11],
      ],
    }),
  ).toEqual([
    [10, 60],
    [11, 60],
    [11, 59],
    [10, 59],
  ]);
  expect(JSON.parse(mapboxBasemap("standard")).imports[0].url).toBe(
    "mapbox://styles/mapbox/standard",
  );
  expect(JSON.parse(mapboxBasemap("satellite")).imports[0].url).toBe(
    "mapbox://styles/mapbox/standard-satellite",
  );
  expect(mapboxConfiguration("satellite", true, false).showRoadLabels).toBe(
    false,
  );
  expect(mapboxConfiguration("hybrid", true, false).showRoadLabels).toBe(true);
});

test("club zone owner pins and map shapes both select the correct zone", async () => {
  const onSelect = jest.fn();
  const turfs: any[] = [
    {
      id: "zone-1",
      owner_id: "owner",
      name: "Parken",
      route: points,
      profiles: { display_name: "Anna", avatar_path: null },
    },
  ];
  await render(
    <MapboxClubZoneMap
      turfs={turfs}
      selected={undefined}
      onSelect={onSelect}
      satellite={false}
      recenter={0}
      target={null}
      onUnavailable={jest.fn()}
    />,
  );
  await fireEvent.press(screen.getByRole("button", { name: "Velg Parken" }));
  expect(onSelect).toHaveBeenLastCalledWith("zone-1");
  await act(async () =>
    screen
      .getByTestId("map-shape")
      .props.onPress({ features: [{ properties: { id: "zone-1" } }] }),
  );
  expect(onSelect).toHaveBeenCalledTimes(2);
  const polygon = screen
    .getByTestId("map-shape")
    .props.shape.features.find((f: any) => f.geometry.type === "Polygon")
    .geometry.coordinates[0];
  expect(polygon[0]).toEqual(polygon[polygon.length - 1]);
});
