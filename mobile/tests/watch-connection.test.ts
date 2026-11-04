import type { Session } from "@supabase/supabase-js";
import {
  setWatchEnabled,
  syncWatch,
  useWatchStatus,
} from "../src/features/watch/sync";
import { watchNative } from "../src/features/watch/native";
import { useAppStore } from "../src/stores/useAppStore";
import { useAuthStore } from "../src/stores/useAuthStore";
jest.mock("../src/lib/workoutStorage", () => ({
  workoutStorage: jest.requireMock("@react-native-async-storage/async-storage"),
}));
jest.mock("../src/features/watch/native", () => ({
  watchNative: {
    status: jest.fn(),
    setOwner: jest.fn(async () => {}),
    pending: jest.fn(async () => []),
    acknowledge: jest.fn(),
    addListener: jest.fn(),
  },
}));
beforeEach(() => {
  jest.clearAllMocks();
  useAuthStore.setState({
    ready: true,
    session: { user: { id: "a" } } as Session,
  });
  useAppStore.setState({ ready: true, watchOwners: ["a"] });
});

test("a connected watch can be enabled and disabled; disabling clears native identity even after unpairing", async () => {
  useAppStore.setState({ watchOwners: [] });
  jest
    .mocked(watchNative!.status)
    .mockResolvedValue({ paired: true, installed: true, reachable: false });
  await syncWatch();
  await setWatchEnabled("a", true);
  expect(useAppStore.getState().watchOwners).toEqual(["a"]);
  expect(watchNative!.setOwner).toHaveBeenLastCalledWith("a");
  jest
    .mocked(watchNative!.status)
    .mockResolvedValue({ paired: false, installed: false, reachable: false });
  await setWatchEnabled("a", false);
  expect(useAppStore.getState().watchOwners).toEqual([]);
  expect(watchNative!.setOwner).toHaveBeenLastCalledWith("");
});
test("a missing Watch or changed account cannot enable a connection", async () => {
  useAppStore.setState({ watchOwners: [] });
  useWatchStatus.setState({ paired: false, installed: false });
  await expect(setWatchEnabled("a", true)).rejects.toThrow(
    "Koble til Apple Watch",
  );
  await expect(setWatchEnabled("other", true)).rejects.toThrow(
    "Kontoen er endret",
  );
  expect(useAppStore.getState().watchOwners).toEqual([]);
});
test.each([
  { paired: false, installed: false },
  { paired: true, installed: false },
])(
  "missing watch/app reports connection without attempting transfer: %j",
  async (connection) => {
    jest
      .mocked(watchNative!.status)
      .mockResolvedValue({ ...connection, reachable: false });
    useWatchStatus.setState({ error: "previous error" });
    await syncWatch();
    expect(watchNative!.setOwner).not.toHaveBeenCalled();
    expect(watchNative!.pending).not.toHaveBeenCalled();
    expect(useWatchStatus.getState()).toMatchObject({
      ...connection,
      busy: false,
      error: null,
    });
  },
);
test("an installed paired watch can sync even when not currently reachable", async () => {
  jest
    .mocked(watchNative!.status)
    .mockResolvedValue({ paired: true, installed: true, reachable: false });
  await syncWatch();
  expect(watchNative!.setOwner).toHaveBeenCalledWith("a");
  expect(watchNative!.pending).toHaveBeenCalledWith("a");
  expect(useWatchStatus.getState()).toMatchObject({ busy: false, error: null });
});
