import { NativeModules, Platform } from "react-native";
import { mapboxAvailability } from "../src/features/maps/provider";
let mockHasToken = true;
jest.mock("../src/features/maps/config", () => ({
  get hasMapbox() {
    return mockHasToken;
  },
}));
test("native capability and token are both required, without importing the SDK", () => {
  const old = NativeModules.RNMBXModule;
  const os = Platform.OS;
  try {
    Platform.OS = "ios";
    delete NativeModules.RNMBXModule;
    expect(mapboxAvailability()).toBe("build");
    NativeModules.RNMBXModule = {};
    mockHasToken = false;
    expect(mapboxAvailability()).toBe("token");
    mockHasToken = true;
    expect(mapboxAvailability()).toBe("ready");
    Platform.OS = "android";
    expect(mapboxAvailability()).toBe("build");
  } finally {
    NativeModules.RNMBXModule = old;
    Platform.OS = os;
  }
});
