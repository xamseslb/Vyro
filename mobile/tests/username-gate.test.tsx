import type { Session } from "@supabase/supabase-js";
import { act, render, screen, fireEvent } from "@testing-library/react-native";
import { UsernameGate } from "../src/components/UsernameGate";
import { useAuthStore } from "../src/stores/useAuthStore";
import { useProfileStore } from "../src/stores/useProfileStore";
import { supabase } from "../src/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

jest.mock("expo-router", () => ({ usePathname: () => "/profile" }));
jest.mock("../src/components/ui", () => {
  const { Text, Pressable } = require("react-native");
  return {
    Txt: Text,
    useTheme: () => ({}),
    Button: ({ title, onPress }: { title: string; onPress: () => void }) => (
      <Pressable accessibilityRole="button" onPress={onPress}>
        <Text>{title}</Text>
      </Pressable>
    ),
  };
});
jest.mock("../src/features/social/push", () => ({
  preparePushSignOut: jest.fn(),
}));
jest.mock("../src/lib/supabase", () => ({ supabase: { from: jest.fn() } }));

test("an OAuth account with a generated handle must claim a unique name once", async () => {
  const profile = {
    id: "account-a",
    username: "runner_" + "a".repeat(32),
    display_name: "Ada",
    is_private: false,
    avatar_path: null,
  };
  useAuthStore.setState({
    session: { user: { id: profile.id } } as Session,
    ready: true,
  });
  const single = jest
    .fn()
    .mockResolvedValueOnce({ data: profile })
    .mockResolvedValueOnce({ error: { code: "23505" } })
    .mockResolvedValueOnce({ data: { ...profile, username: "ada_123" } });
  const query = {
    select: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    abortSignal: jest.fn().mockReturnThis(),
    single,
  };
  (supabase!.from as jest.Mock).mockReturnValue(query);
  await render(<UsernameGate />);
  await fireEvent.changeText(
    await screen.findByLabelText("Brukernavn"),
    "@Ada",
  );
  await fireEvent.press(screen.getByText("Lagre og fortsett"));
  expect(screen.getByText(/brukernavnet er opptatt/)).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText("Brukernavn"), "@Ada_123");
  await fireEvent.press(screen.getByText("Lagre og fortsett"));
  expect(query.update).toHaveBeenLastCalledWith({ username: "ada_123" });
  expect(screen.queryByLabelText("Brukernavn")).toBeNull();
  expect(useProfileStore.getState().profile?.username).toBe("ada_123");
  expect(await AsyncStorage.getItem("vyro-username-chosen:account-a")).toBe(
    "1",
  );
  await act(() => useAuthStore.setState({ session: null }));
});
