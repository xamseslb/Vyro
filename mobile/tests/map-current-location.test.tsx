import { act, fireEvent, render, screen } from "@testing-library/react-native";
import Maps from "../src/app/(tabs)/map";
import { Linking } from "react-native";

jest.setTimeout(15000);

let mockMap: any;
let mockFocus: () => () => void;
const mockRequest = jest.fn();
const mockFix = {
  latitude: 59.92,
  longitude: 10.74,
  timestamp: Date.now(),
  accuracy: 5,
};
let mockLocation: any;
const mockWorkouts = [
  {
    id: "old-route",
    source: "gps",
    title: "Gammel tur",
    seconds: 800,
    distance: 2,
    route: [
      { latitude: 60, longitude: 11 },
      { latitude: 60.01, longitude: 11.01 },
    ],
  },
];

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({}),
  useFocusEffect: (effect: () => () => void) => {
    mockFocus = effect;
    require("react").useEffect(effect, [effect]);
  },
}));
jest.mock("../src/components/LiveMap", () => ({
  __esModule: true,
  default: (props: any) => {
    mockMap = props;
    return require("react").createElement(require("react-native").Pressable, {
      testID: "pan-map",
      onPress: props.onPan,
    });
  },
}));
jest.mock("../src/features/tracking/useLiveLocation", () => ({
  useLiveLocation: () => mockLocation,
}));
jest.mock("../src/features/activities/useVisibleWorkouts", () => ({
  useVisibleWorkouts: () => mockWorkouts,
}));
jest.mock("../src/stores/useSavedRoutes", () => ({
  useSavedRoutes: () => ({ ids: [], toggle: jest.fn() }),
}));
jest.mock("../src/stores/useAuthStore", () => ({
  useAuthStore: (selector: any) => selector({}),
}));
jest.mock("../src/stores/useAppStore", () => ({
  useAppStore: (selector: any) => selector({ defaultMapKind: "standard" }),
}));
jest.mock("../src/features/turf/ClubZones", () => ({ ClubZones: () => null }));
jest.mock("../src/components/AccountGate", () => ({
  AccountGate: ({ children }: any) => children,
}));
jest.mock("../src/components/MapRouteSheet", () => ({
  MapRouteSheet: ({ children }: any) => children,
}));
jest.mock("../src/components/ui", () => ({
  Txt: require("react-native").Text,
  Icon: () => null,
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}));
jest.mock("../src/components/MapSearch", () => ({
  MapSearch: ({ onSelect }: any) =>
    require("react").createElement(require("react-native").Pressable, {
      testID: "search-place",
      onPress: () =>
        onSelect({ name: "Bergen", latitude: 60.39, longitude: 5.32 }),
    }),
}));
jest.mock("../src/components/MapLengthFilter", () => ({
  MapLengthFilter: ({ onChange }: any) =>
    require("react").createElement(require("react-native").Pressable, {
      testID: "filter-length",
      onPress: () => onChange(1),
    }),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockRequest.mockReset();
  mockFix.timestamp = Date.now();
  mockLocation = {
    permission: "granted",
    position: mockFix,
    error: "",
    canAskAgain: true,
    request: mockRequest,
  };
});
const tap = (label: string) => fireEvent.press(screen.getByLabelText(label));

test("opening Maps shows the current position, not a previous GPS route", async () => {
  await render(<Maps />);
  expect(mockMap.follow).toBe(true);
  expect(mockMap.position).toEqual(mockFix);
  expect(mockMap.overlays).toEqual([]);
  expect(screen.queryByText("Gammel tur")).toBeNull();
  expect(screen.queryByLabelText("Vis hele ruten")).toBeNull();
  await tap("Vis mine lagrede ruter");
  expect(mockMap.follow).toBe(false);
  expect(mockMap.overlays[0].id).toBe("old-route");
  expect(screen.getByText("Gammel tur")).toBeTruthy();
  await tap("Vis min posisjon");
  expect(mockMap.follow).toBe(true);
  expect(mockMap.overlays).toEqual([]);
});

test("a late location does not override a manually chosen place or pan", async () => {
  mockLocation.position = null;
  const view = await render(<Maps />);
  await fireEvent.press(screen.getByTestId("search-place"));
  mockLocation.position = mockFix;
  await view.rerender(<Maps />);
  expect(mockMap.follow).toBe(false);
  expect(mockMap.target.name).toBe("Bergen");
  await tap("Vis min posisjon");
  await fireEvent.press(screen.getByTestId("pan-map"));
  await view.rerender(<Maps />);
  expect(mockMap.follow).toBe(false);
});

test("returning to Maps resets a route selection; 2D/3D does not select a route", async () => {
  await render(<Maps />);
  await tap("Vis mine lagrede ruter");
  await act(() => {
    mockFocus();
  });
  expect(mockMap.overlays).toEqual([]);
  expect(mockMap.follow).toBe(true);
  await tap("Vis i 3D");
  expect(mockMap.threeD).toBe(true);
  await tap("Vis i 2D");
  expect(mockMap.threeD).toBe(false);
  expect(mockMap.follow).toBe(true);
});

test("length filtering explicitly selects stored routes", async () => {
  await render(<Maps />);
  await fireEvent.press(screen.getByTestId("filter-length"));
  expect(mockMap.overlays[0].id).toBe("old-route");
  expect(mockMap.follow).toBe(false);
});

test("missing permission and stale fixes never pretend to be a current position", async () => {
  mockLocation.permission = "undetermined";
  const view = await render(<Maps />);
  expect(mockMap.position).toBeNull();
  expect(
    screen.getByText("Trykk på posisjonsknappen for å vise hvor du er."),
  ).toBeTruthy();
  mockLocation.permission = "granted";
  mockLocation.position = { ...mockFix, timestamp: Date.now() - 60000 };
  await view.rerender(<Maps />);
  expect(mockMap.position).toBeNull();
});

test("a permission response cannot steal focus after panning or leave locate disabled", async () => {
  mockLocation.permission = "undetermined";
  mockRequest.mockImplementation(
    () => new Promise<boolean>((resolve) => {
      // The user moves the map while the native permission result is pending.
      setTimeout(() => {
        mockMap.onPan();
        resolve(true);
      }, 0);
    }),
  );
  await render(<Maps />);
  await tap("Vis min posisjon");
  expect(mockMap.follow).toBe(false);
  expect(screen.getByLabelText("Vis min posisjon")).not.toBeDisabled();
});

test("denied permissions open Settings; errors leave a retryable control", async () => {
  mockLocation.permission = "denied";
  mockLocation.canAskAgain = false;
  const settings = jest
    .spyOn(Linking, "openSettings")
    .mockRejectedValue(new Error("unavailable"));
  await render(<Maps />);
  await tap("Vis min posisjon");
  expect(settings).toHaveBeenCalledTimes(1);
  expect(mockRequest).not.toHaveBeenCalled();
  expect(
    screen.getByText("Kunne ikke åpne posisjon. Prøv igjen."),
  ).toBeTruthy();
  expect(screen.getByLabelText("Vis min posisjon")).not.toBeDisabled();
  settings.mockRestore();
});
