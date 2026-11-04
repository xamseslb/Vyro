import { Component, type ReactNode, useState } from "react";
import { Pressable, View } from "react-native";
import { useAppStore } from "../stores/useAppStore";
import { mapboxAvailability } from "../features/maps/provider";
import { Txt } from "./ui";

// Both providers remain installed. A failed map must never stop a workout.
export function MapProviderView({
  apple,
  mapbox,
  height = 300,
  noticeBottom = 0,
}: {
  apple: ReactNode;
  mapbox: (onUnavailable: () => void) => ReactNode;
  height?: number;
  noticeBottom?: number;
}) {
  const provider = useAppStore((s) => s.mapProvider);
  return provider === "mapbox" ? (
    <MapboxTrial
      apple={apple}
      mapbox={mapbox}
      height={height}
      noticeBottom={noticeBottom}
    />
  ) : (
    apple
  );
}

function MapboxTrial({
  apple,
  mapbox,
  height,
  noticeBottom,
}: {
  apple: ReactNode;
  mapbox: (onUnavailable: () => void) => ReactNode;
  height: number;
  noticeBottom: number;
}) {
  const [failed, setFailed] = useState(false);
  const unavailable = mapboxAvailability() !== "ready" || failed;
  const fallback = (
    <View style={height === 0 ? { flex: 1 } : { height }}>
      {apple}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Mapbox utilgjengelig. Behold Apple-kart"
        onPress={() =>
          useAppStore.getState().preferences({ mapProvider: "apple" })
        }
        style={{
          position: "absolute",
          bottom: noticeBottom + 38,
          alignSelf: "center",
          borderRadius: 16,
          padding: 10,
          backgroundColor: "#FFFFFFF0",
          maxWidth: "90%",
        }}
      >
        <Txt size={12} style={{ color: "#11182C" }}>
          Mapbox utilgjengelig · Viser Apple-kart
        </Txt>
      </Pressable>
    </View>
  );
  return unavailable ? (
    fallback
  ) : (
    <MapErrorBoundary fallback={fallback}>
      <MapboxContent render={mapbox} onUnavailable={() => setFailed(true)} />
    </MapErrorBoundary>
  );
}

function MapboxContent({
  render,
  onUnavailable,
}: {
  render: (onUnavailable: () => void) => ReactNode;
  onUnavailable: () => void;
}) {
  return render(onUnavailable);
}

class MapErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
