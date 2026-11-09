import { message as uiText } from "../i18n/language";
import { useState } from "react";
import { Linking, Pressable, View } from "react-native";
import { Txt, useTheme } from "./ui";

const site = "https://vyro-hjelp.xamse641.chatgpt.site";
const links = [
  { get title() { return uiText("Personvernerklæring"); }, url: site + "/privacy.html" },
  { get title() { return uiText("Brukerstøtte"); }, url: site + "/" },
];

export function VyroPublicLinks() {
  const c = useTheme();
  const [error, setError] = useState("");
  async function open(url: string) {
    setError("");
    try {
      await Linking.openURL(url);
    } catch {
      setError(uiText("Kunne ikke åpne siden. Prøv igjen."));
    }
  }
  return (
    <View style={{ alignItems: "center", paddingHorizontal: 12 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center" }}>
        {links.map(({ title, url }) => (
          <Pressable key={url} accessibilityRole="link" onPress={() => void open(url)}
            style={{ minHeight: 44, paddingHorizontal: 10, justifyContent: "center" }}>
            <Txt size={14} style={{ color: c.text, textDecorationLine: "underline" }}>{title}</Txt>
          </Pressable>
        ))}
      </View>
      {!!error && <View accessibilityLiveRegion="polite"><Txt muted>{error}</Txt></View>}
    </View>
  );
}
