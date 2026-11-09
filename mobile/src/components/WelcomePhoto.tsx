import { Image, StyleSheet, View } from "react-native";
import { Logo } from "./ui";

export const welcomePhotos = {
  trail: require("../../assets/welcome/club-run.jpg"),
  waterfront: require("../../assets/welcome/waterfront-run.jpg"),
} as const;

export function WelcomePhoto({
  scene,
  height,
  width,
}: {
  scene: keyof typeof welcomePhotos;
  height: number;
  width?: number;
}) {
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        height,
        width,
        overflow: "hidden",
        backgroundColor: scene === "trail" ? "#E7DECB" : "#344E62",
      }}
    >
      <Image
        accessible={false}
        source={welcomePhotos[scene]}
        resizeMode="cover"
        style={{ width: "100%", height: "100%" }}
      />
      <View style={styles.badge}>
        <Logo width={96} color="#101A30" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    top: 16,
    left: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
});
