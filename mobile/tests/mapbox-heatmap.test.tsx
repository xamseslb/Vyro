import { act, renderHook } from "@testing-library/react-native";
import { useMapboxHeatmap } from "../src/features/maps/useMapboxHeatmap";

const mockFiles: any[] = [];
const mockWrite = jest.fn().mockResolvedValue(undefined);
jest.mock("expo-file-system", () => ({
  Paths: { cache: "file:///private/cache" },
  File: class {
    uri: string;
    exists = true;
    create = jest.fn();
    write = mockWrite;
    delete = jest.fn();
    constructor(parent: string, name: string) {
      this.uri = `${parent}/${name}`;
      mockFiles.push(this);
    }
  },
}));
beforeEach(() => {
  mockFiles.length = 0;
  mockWrite.mockReset().mockResolvedValue(undefined);
});
test("native heatmaps use private file URLs and replacement/unmount removes their files", async () => {
  const failure = jest.fn();
  const view = await renderHook<string | null, { data: string }>(
    ({ data }) => useMapboxHeatmap(data, failure),
    {
      initialProps: { data: "data:image/png;base64,AAAA" },
    },
  );
  expect(view.result.current).toMatch(/^file:\/\/\/private\/cache\//);
  expect(mockWrite).toHaveBeenCalledWith("AAAA", { encoding: "base64" });
  await view.rerender({ data: "data:image/png;base64,BBBB" });
  expect(mockFiles[0].delete).toHaveBeenCalledTimes(1);
  expect(view.result.current).toBe(mockFiles[1].uri);
  await view.unmount();
  expect(mockFiles[1].delete).toHaveBeenCalledTimes(1);
  expect(failure).not.toHaveBeenCalled();
});
test("ordinary routes do not create a heatmap file", async () => {
  const failure = jest.fn();
  const view = await renderHook(() => useMapboxHeatmap(undefined, failure));
  expect(view.result.current).toBeNull();
  expect(mockFiles).toHaveLength(0);
  expect(failure).not.toHaveBeenCalled();
});
test("closing during a pending write still cleans up without updating an unmounted map", async () => {
  let finish!: () => void;
  mockWrite.mockImplementation(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const view = await renderHook(() =>
    useMapboxHeatmap("data:image/png;base64,AAAA", jest.fn()),
  );
  await view.unmount();
  await act(async () => finish());
  expect(mockFiles[0].delete).toHaveBeenCalledTimes(1);
});
test("write failure falls back without leaving a private image behind", async () => {
  mockWrite.mockRejectedValue(new Error("disk full"));
  const failure = jest.fn();
  const view = await renderHook(() =>
    useMapboxHeatmap("data:image/png;base64,AAAA", failure),
  );
  expect(view.result.current).toBeNull();
  expect(failure).toHaveBeenCalledTimes(1);
  expect(mockFiles[0].delete).toHaveBeenCalled();
});
