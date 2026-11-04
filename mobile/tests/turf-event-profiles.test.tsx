import { fireEvent, render, screen } from "@testing-library/react-native";
import { router } from "expo-router";
import { TurfEvents } from "../src/components/TurfEvents";
import { client } from "../src/features/social/api";

jest.mock("expo-router", () => ({
  router: { push: jest.fn() },
  useFocusEffect: (fn: () => void) => require("react").useEffect(fn, [fn]),
}));
jest.mock("../src/lib/workoutStorage", () => ({
  workoutStorage: require("@react-native-async-storage/async-storage"),
}));
jest.mock("../src/features/social/api", () => ({ client: jest.fn() }));
jest.mock("../src/components/ui", () => ({
  Txt: require("react-native").Text,
  Card: require("react-native").View,
  Button: () => null,
}));

test("zone event identities link by authorized IDs even when two people share a name", async () => {
  const query = {
    select: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    abortSignal: jest
      .fn()
      .mockResolvedValue({
        data: [
          { id: "event", actor_id: "actor", previous_owner_id: "previous" },
        ],
        error: null,
      }),
  };
  const from = jest.fn(() => query);
  jest.mocked(client).mockReturnValue({
    rpc: () => ({
      abortSignal: async () => ({
        data: [
          {
            id: "event",
            turf_id: "zone",
            distance_m: 1200,
            extended: false,
            actor: { display_name: "Alex" },
            previous: { display_name: "Alex" },
          },
        ],
        error: null,
      }),
    }),
    from,
  } as unknown as ReturnType<typeof client>);
  await render(<TurfEvents userId="owner" />);
  const identities = await screen.findAllByLabelText("Vis profilen til Alex");
  expect(query.in).toHaveBeenCalledWith("id", ["event"]);
  await fireEvent.press(identities[0]);
  expect(router.push).toHaveBeenLastCalledWith({
    pathname: "/person/[id]",
    params: { id: "actor" },
  });
  await fireEvent.press(identities[1]);
  expect(router.push).toHaveBeenLastCalledWith({
    pathname: "/person/[id]",
    params: { id: "previous" },
  });
});
