import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react-native";
import { router } from "expo-router";
import type { Session } from "@supabase/supabase-js";
import Person from "../src/app/person/[id]";
import { ProfileLink } from "../src/components/ProfileLink";
import { loadPerson, loadPersonPosts } from "../src/features/social/person";
import { changeFollow } from "../src/features/social/profiles";
// Full native screens traverse the safe-area/header tree on this Windows runner.
jest.setTimeout(30000);
import { useAuthStore } from "../src/stores/useAuthStore";
jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => true,
  },
  useLocalSearchParams: () => ({ id: "friend" }),
  useFocusEffect: (fn: () => void) => require("react").useEffect(fn, [fn]),
}));
jest.mock("../src/lib/workoutStorage", () => ({
  workoutStorage: require("@react-native-async-storage/async-storage"),
}));
jest.mock("../src/components/AccountGate", () => ({
  AccountGate: ({ children }: { children: React.ReactNode }) => children,
}));
jest.mock("../src/components/SafetyActions", () => () => null);
jest.mock("../src/components/CloudPost", () => ({ CloudPost: () => null }));
jest.mock("../src/features/social/person", () => ({
  loadPerson: jest.fn(),
  loadPersonPosts: jest.fn(),
}));
jest.mock("../src/features/social/profiles", () => ({
  changeFollow: jest.fn(),
}));
const profile = {
  id: "friend",
  display_name: "Mina",
  username: "runner_e85ffea8a1e7416c834b2c79e9d65617",
  is_private: true,
};
beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    ready: true,
    session: { user: { id: "me" } } as Session,
  });
  jest.mocked(loadPersonPosts).mockResolvedValue({ posts: [], more: false });
});
test("private profiles hide posts until following is approved; requesting doesn't reveal them", async () => {
  jest.mocked(loadPerson).mockResolvedValue({ profile, state: "none" });
  jest.mocked(changeFollow).mockResolvedValue("requested");
  await render(<Person />);
  expect(await screen.findByText("Denne profilen er privat")).toBeTruthy();
  expect(screen.queryByText(/runner_/)).toBeNull();
  expect(loadPersonPosts).not.toHaveBeenCalled();
  jest.mocked(loadPerson).mockResolvedValue({ profile, state: "requested" });
  await fireEvent.press(screen.getByText("Be om å følge"));
  expect(changeFollow).toHaveBeenCalledWith("me", "friend", true);
  expect(await screen.findByText("Avbryt forespørsel")).toBeTruthy();
  expect(loadPersonPosts).not.toHaveBeenCalled();
});
test.each([false, true])(
  "public or approved profiles fetch shared posts through the authenticated API: private=%s",
  async (isPrivate) => {
    jest
      .mocked(loadPerson)
      .mockResolvedValue({
        profile: { ...profile, is_private: isPrivate },
        state: isPrivate ? "following" : "none",
      });
    await render(<Person />);
    await waitFor(() =>
      expect(loadPersonPosts).toHaveBeenCalledWith(
        "friend",
        expect.any(AbortSignal),
      ),
    );
    expect(
      await screen.findByText("Ingen delte økter å vise ennå."),
    ).toBeTruthy();
  },
);
test("identity links open exact profiles, own identity opens Du, and modal closes first", async () => {
  const close = jest.fn();
  await render(
    <>
      <ProfileLink id="friend" name="Mina" beforeOpen={close} />
      <ProfileLink id="me" name="Alex" />
    </>,
  );
  await fireEvent.press(screen.getByLabelText("Vis profilen til Mina"));
  expect(close).toHaveBeenCalledTimes(1);
  expect(router.push).toHaveBeenCalledWith({
    pathname: "/person/[id]",
    params: { id: "friend" },
  });
  await fireEvent.press(screen.getByLabelText("Vis profilen til Alex"));
  expect(router.push).toHaveBeenLastCalledWith("/profile");
});
test("an unavailable profile has no follow control or posts", async () => {
  jest.mocked(loadPerson).mockResolvedValue(null);
  await render(<Person />);
  expect(
    await screen.findByText("Profilen er ikke tilgjengelig."),
  ).toBeTruthy();
  expect(loadPersonPosts).not.toHaveBeenCalled();
  expect(screen.queryByText("Følg")).toBeNull();
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
