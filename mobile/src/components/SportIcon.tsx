import { Image, View } from "react-native";
import { sportArtwork } from "../features/activities/sportArtwork";
import { sportInfo, type Sport } from "../features/activities/sports";
import { Icon, useTheme } from "./ui";

/** Decorative: the adjacent sport name or enclosing control supplies the label. */
export default function SportIcon({
  sport,
  size = 44,
}: {
  sport: Sport;
  size?: number;
}) {
  const c = useTheme();
  const source = sportArtwork(sport);
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {source ? (
        <Image
          source={source}
          resizeMode="contain"
          accessible={false}
          style={{ width: size, height: size }}
        />
      ) : (
        <Icon name={sportInfo(sport).icon} color={c.text} size={size} />
      )}
    </View>
  );
}
