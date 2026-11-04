import { NativeModules, Platform } from "react-native";
import { hasMapbox } from "./config";

export type MapProvider = "apple" | "mapbox";

// Do not import the SDK here: importing it throws in Expo Go / older builds.
export function mapboxAvailability(): "ready" | "build" | "token" {
  if (Platform.OS !== "ios" || !NativeModules.RNMBXModule) return "build";
  return hasMapbox ? "ready" : "token";
}
