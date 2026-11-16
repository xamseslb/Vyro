import { useState, type ReactNode } from "react";
import { View } from "react-native";

/** Give the native map its actual available height, below headers and controls. */
export function MapViewport({ children }: { children: (height: number) => ReactNode }) {
  const [height, setHeight] = useState(0);
  return (
    <View style={{ flex: 1 }} onLayout={(event) => setHeight(event.nativeEvent.layout.height)}>
      {height > 0 && children(height)}
    </View>
  );
}
