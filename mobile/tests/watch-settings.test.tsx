import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { Session } from "@supabase/supabase-js";
import Watch from "../src/app/apple-watch";
import { useAppStore } from "../src/stores/useAppStore";
import { useAuthStore } from "../src/stores/useAuthStore";
import {
  setWatchEnabled,
  syncWatch,
  useWatchStatus,
} from "../src/features/watch/sync";
jest.mock("../src/lib/workoutStorage", () => ({
  workoutStorage: require("@react-native-async-storage/async-storage"),
}));
jest.mock("expo-router", () => ({
  router: {},
  useFocusEffect: (fn: () => void) => require("react").useEffect(fn, [fn]),
}));
jest.mock("../src/components/AccountGate", () => ({
  AccountGate: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("../src/features/watch/sync", () => ({
  watchSupported: true,
  syncWatch: jest.fn(async () => {}),
  setWatchEnabled: jest.fn(async () => {}),
  useWatchStatus: require("zustand").create(() => ({
    paired: false,
    installed: false,
    reachable: false,
    checked: true,
    busy: false,
    error: null,
    imported: 0,
  })),
}));
beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    ready: true,
    session: { user: { id: "me" } } as Session,
  });
  useAppStore.setState({ ready: true, watchOwners: [] });
  useWatchStatus.setState({
    paired: false,
    installed: false,
    checked: true,
    busy: false,
    error: null,
  });
});
test("missing hardware explains disabled toggle and allows retry", async () => {
  await render(<Watch />);
  expect(screen.getByText("Ingen Apple Watch tilkoblet")).toBeTruthy();
  expect(screen.getByLabelText("Bruk VYRO på Apple Watch")).toBeDisabled();
  await fireEvent.press(screen.getByText("Sjekk tilkoblingen"));
  expect(syncWatch).toHaveBeenCalledTimes(2);
});
test("paired but missing app gives installation instructions; reconnect enables the toggle", async () => {
  useWatchStatus.setState({ paired: true });
  await render(<Watch />);
  expect(screen.getByText("Installer VYRO på klokken")).toBeTruthy();
  await act(() =>
    useWatchStatus.setState({ installed: true, reachable: false }),
  );
  expect(screen.getByLabelText("Bruk VYRO på Apple Watch")).toBeEnabled();
  await fireEvent(
    screen.getByLabelText("Bruk VYRO på Apple Watch"),
    "valueChange",
    true,
  );
  expect(setWatchEnabled).toHaveBeenCalledWith("me", true);
});
test("an enabled account can disconnect even after the watch is unpaired", async () => {
  useAppStore.setState({ watchOwners: ["me"] });
  await render(<Watch />);
  expect(screen.getByLabelText("Bruk VYRO på Apple Watch")).toBeEnabled();
  await fireEvent(
    screen.getByLabelText("Bruk VYRO på Apple Watch"),
    "valueChange",
    false,
  );
  expect(setWatchEnabled).toHaveBeenCalledWith("me", false);
});

jest.mock("../src/components/ui", () => {
  const React = jest.requireActual("react");
  const { View, Text, Pressable } = jest.requireActual("react-native");
  return {
    Txt: Text,
    Screen: View,
    Icon: () => null,
    styles: {},
    useTheme: () => ({
      text: "#11182C",
      surface: "white",
      raised: "#eee",
      border: "#ddd",
      muted: "#555",
      accent: "green",
      onAccent: "white",
    }),
    Chip: ({
      title,
      selected,
      onPress,
    }: {
      title: string;
      selected: boolean;
      onPress: () => void;
    }) =>
      React.createElement(
        Pressable,
        {
          onPress,
          accessibilityRole: "button",
          accessibilityState: { selected },
        },
        React.createElement(Text, null, title),
      ),
    Button: ({
      title,
      disabled,
      onPress,
    }: {
      title: string;
      disabled: boolean;
      onPress: () => void;
    }) =>
      React.createElement(
        Pressable,
        { accessibilityRole: "button", disabled, onPress },
        React.createElement(Text, null, title),
      ),
  };
});
