import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import Activity from "../src/app/activity/[id]";
import ShareWorkout from "../src/app/share-workout";
import { publish } from "../src/features/social/api";
import { useAppStore, appPersistence } from "../src/stores/useAppStore";
import { useAuthStore } from "../src/stores/useAuthStore";
import type { Workout } from "../src/features/activities/model";

let mockParams: Record<string, string> = {};
let mockProfile: { id: string; is_private: boolean } | null;
jest.mock("expo-router", () => ({
  router: {
    back: jest.fn(),
    replace: jest.fn(),
    push: jest.fn(),
    setParams: jest.fn(),
    canGoBack: () => true,
  },
  useLocalSearchParams: () => mockParams,
}));
jest.mock("../src/features/auth/useOwnProfile", () => ({
  useOwnProfile: () => ({ profile: mockProfile, failed: !mockProfile }),
}));
jest.mock("../src/features/social/api", () => ({
  publish: jest.fn(),
  socialError: () => "Prøv igjen når du er på nett.",
}));
jest.mock("../src/components/AccountGate", () => ({
  AccountGate: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("../src/components/WorkoutMap", () => () => null);
jest.mock("../src/components/FootballMap", () => () => null);
jest.mock("../src/components/ExportWorkout", () => ({
  ExportWorkout: () => null,
}));
jest.mock("../src/lib/workoutStorage", () => ({
  workoutStorage: require("@react-native-async-storage/async-storage"),
}));
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
jest.mock("../src/components/SettingsUi", () => ({
  Page: ({
    children,
    footer,
    title,
  }: {
    children: React.ReactNode;
    footer: React.ReactNode;
    title: string;
  }) => {
    const React = jest.requireActual("react");
    const { View, Text } = jest.requireActual("react-native");
    return React.createElement(
      View,
      null,
      React.createElement(Text, null, title),
      children,
      footer,
    );
  },
}));

const workout: Workout = {
  id: "strength",
  ownerId: "owner",
  title: "Styrke etter jobb",
  sport: "Styrketrening",
  source: "timer",
  seconds: 1800,
  distance: 0,
  route: [],
  date: "2026-11-02T12:00:00Z",
  notes: "Dette skal aldri med i innlegget",
  effort: 6,
  visibility: "private",
};
beforeEach(() => {
  jest.clearAllMocks();
  mockProfile = { id: "owner", is_private: false };
  mockParams = { workoutId: "strength", audience: "followers" };
  useAuthStore.setState({
    session: { user: { id: "owner" } } as Session,
    ready: true,
  });
  useAppStore.setState({
    workouts: [workout, { ...workout, id: "second", title: "En annen økt" }],
    sharingAudienceByOwner: { owner: "everyone" },
  });
  jest.mocked(publish).mockReset().mockResolvedValue("post");
});
afterEach(async () => {
  await appPersistence.flush();
});

test("keeping a newly saved workout private leaves the record intact and publishes nothing", async () => {
  mockParams = { id: "strength", saved: "1" };
  await render(<Activity />);
  expect(screen.queryByText("Privat økt")).toBeNull();
  await fireEvent.press(screen.getByRole("button", { name: "Behold privat" }));
  expect(router.replace).toHaveBeenCalledWith("/(tabs)/profile");
  expect(publish).not.toHaveBeenCalled();
  expect(useAppStore.getState().workouts[0]).toEqual(workout);
});

test("create post carries the exact workout and removes the fresh-save privacy claim on return", async () => {
  mockParams = { id: "strength", saved: "1" };
  await render(<Activity />);
  await fireEvent.press(screen.getByRole("button", { name: "Lag innlegg" }));
  expect(router.setParams).toHaveBeenCalledWith({ saved: undefined });
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/share-workout",
    params: { workoutId: "strength", audience: "followers" },
  });
  expect(publish).not.toHaveBeenCalled();
});

test("the followers card opens a preview without publishing the workout", async () => {
  mockParams = { id: "strength", saved: "1" };
  await render(<Activity />);
  await fireEvent.press(screen.getByRole("button", { name: "Del med følgerne dine" }));
  expect(router.setParams).toHaveBeenCalledWith({ saved: undefined });
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/share-workout",
    params: { workoutId: "strength", audience: "followers" },
  });
  expect(publish).not.toHaveBeenCalled();
  expect(useAppStore.getState().workouts[0]).toEqual(workout);
});

test("an existing workout never claims that an already shared post becomes private", async () => {
  mockParams = { id: "strength" };
  await render(<Activity />);
  expect(screen.queryByRole("button", { name: "Behold privat" })).toBeNull();
  expect(
    screen.getByRole("button", { name: "Til treningsloggen" }),
  ).toBeTruthy();
});

test("preview opens the chosen workout, keeps private notes out, and explicitly shares to followers", async () => {
  await render(<ShareWorkout />);
  expect(screen.getByText("Styrke etter jobb")).toBeTruthy();
  expect(screen.queryByText(workout.notes)).toBeNull();
  expect(screen.queryByText("Velg økt")).toBeNull();
  expect(screen.getByRole("radio", { name: "Følgere" })).toBeChecked();
  expect(publish).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole("button", { name: "Del med følgere" }),
  );
  expect(publish).toHaveBeenCalledWith(workout, "owner", "followers", false);
});

test("audience selection is explicit and private profiles cannot choose everyone", async () => {
  mockProfile = { id: "owner", is_private: true };
  mockParams = { workoutId: "strength" };
  await render(<ShareWorkout />);
  expect(screen.queryByRole("radio", { name: "Alle i VYRO" })).toBeNull();
  await fireEvent.press(
    screen.getByRole("button", { name: "Del med følgere" }),
  );
  expect(publish).toHaveBeenCalledWith(workout, "owner", "followers", false);
});

test("public profiles can select everyone without changing their default", async () => {
  await render(<ShareWorkout />);
  await fireEvent.press(screen.getByRole("radio", { name: "Alle i VYRO" }));
  await fireEvent.press(
    screen.getByRole("button", { name: "Publiser innlegg" }),
  );
  expect(publish).toHaveBeenCalledWith(workout, "owner", "everyone", false);
});

test("cancel does not publish or delete the original", async () => {
  await render(<ShareWorkout />);
  await fireEvent.press(screen.getByRole("button", { name: "Avbryt" }));
  expect(router.back).toHaveBeenCalled();
  expect(publish).not.toHaveBeenCalled();
  expect(useAppStore.getState().workouts[0]).toEqual(workout);
});

test("failed publication keeps the selected workout and offers a retry", async () => {
  jest.mocked(publish).mockRejectedValueOnce(new Error("offline"));
  await render(<ShareWorkout />);
  await fireEvent.press(
    screen.getByRole("button", { name: "Del med følgere" }),
  );
  expect(screen.getByText("Prøv igjen når du er på nett.")).toBeTruthy();
  expect(screen.getByText(workout.title)).toBeTruthy();
  expect(router.replace).not.toHaveBeenCalled();
  await fireEvent.press(
    screen.getByRole("button", { name: "Del med følgere" }),
  );
  expect(publish).toHaveBeenCalledTimes(2);
  expect(router.replace).toHaveBeenCalledWith("/(tabs)");
});

test("late publication after an account switch cannot navigate the new user", async () => {
  let resolve!: (id: string) => void;
  jest.mocked(publish).mockImplementation(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  await render(<ShareWorkout />);
  await fireEvent.press(
    screen.getByRole("button", { name: "Del med følgere" }),
  );
  expect(screen.getByRole("button", { name: "Deler …" })).toBeDisabled();
  await act(() =>
    useAuthStore.setState({ session: { user: { id: "other" } } as Session }),
  );
  await act(() => resolve("post"));
  expect(router.replace).not.toHaveBeenCalled();
  expect(publish).toHaveBeenCalledTimes(1);
});

test("missing profile blocks publication instead of guessing privacy settings", async () => {
  mockProfile = null;
  await render(<ShareWorkout />);
  expect(
    screen.getByRole("button", { name: "Del med følgere" }),
  ).toBeDisabled();
  expect(screen.getByRole("button", { name: "Prøv igjen" })).toBeTruthy();
  expect(publish).not.toHaveBeenCalled();
});

test("a deep link cannot select another user's workout", async () => {
  useAppStore.setState({ workouts: [{ ...workout, ownerId: "other" }] });
  await render(<ShareWorkout />);
  expect(screen.queryByText(workout.title)).toBeNull();
  expect(screen.queryByRole("button", { name: "Del med følgere" })).toBeNull();
});
