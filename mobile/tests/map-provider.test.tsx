import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { View } from "react-native";
import { MapProviderView } from "../src/components/MapProviderView";
import { useAppStore } from "../src/stores/useAppStore";
import { mapboxAvailability } from "../src/features/maps/provider";

jest.mock("../src/lib/workoutStorage", () => ({
  workoutStorage: require("@react-native-async-storage/async-storage"),
}));
jest.mock("../src/components/ui", () => ({
  Txt: require("react-native").Text,
}));
jest.mock("../src/features/maps/provider", () => ({
  mapboxAvailability: jest.fn(),
}));
const availability = jest.mocked(mapboxAvailability);
beforeEach(() => {
  useAppStore.getState().preferences({ mapProvider: "apple" });
  availability.mockReturnValue("ready");
});

test("Apple is the default and changing providers never mutates workout or recording data", async () => {
  const { recording, workouts } = useAppStore.getState();
  const mapbox = jest.fn(() => <View testID="mapbox" />);
  await render(
    <MapProviderView apple={<View testID="apple" />} mapbox={mapbox} />,
  );
  expect(screen.getByTestId("apple")).toBeTruthy();
  expect(mapbox).not.toHaveBeenCalled();
  await act(async () =>
    useAppStore.getState().preferences({ mapProvider: "mapbox" }),
  );
  expect(screen.getByTestId("mapbox")).toBeTruthy();
  await act(async () =>
    useAppStore.getState().preferences({ mapProvider: "apple" }),
  );
  expect(screen.getByTestId("apple")).toBeTruthy();
  expect(useAppStore.getState().recording).toBe(recording);
  expect(useAppStore.getState().workouts).toBe(workouts);
});

test.each(["build", "token"] as const)(
  "%s unavailable never loads the Mapbox module",
  async (reason) => {
    availability.mockReturnValue(reason);
    useAppStore.getState().preferences({ mapProvider: "mapbox" });
    const load = jest.fn();
    await render(
      <MapProviderView apple={<View testID="apple" />} mapbox={load} />,
    );
    expect(screen.getByTestId("apple")).toBeTruthy();
    expect(load).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole("button"));
    expect(useAppStore.getState().mapProvider).toBe("apple");
  },
);

test("native error returns to Apple and a deliberate provider change can retry", async () => {
  useAppStore.getState().preferences({ mapProvider: "mapbox" });
  let fail = () => {};
  await render(
    <MapProviderView
      apple={<View testID="apple" />}
      mapbox={(onUnavailable) => {
        fail = onUnavailable;
        return <View testID="mapbox" />;
      }}
    />,
  );
  await act(async () => fail());
  expect(screen.getByTestId("apple")).toBeTruthy();
  await fireEvent.press(screen.getByRole("button"));
  await act(async () =>
    useAppStore.getState().preferences({ mapProvider: "mapbox" }),
  );
  expect(screen.getByTestId("mapbox")).toBeTruthy();
});

test("a module/render failure is contained by the Apple fallback", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  useAppStore.getState().preferences({ mapProvider: "mapbox" });
  try {
    await render(
      <MapProviderView
        apple={<View testID="apple" />}
        mapbox={() => {
          throw new Error("native module unavailable");
        }}
      />,
    );
    expect(screen.getByTestId("apple")).toBeTruthy();
  } finally {
    log.mockRestore();
  }
});
