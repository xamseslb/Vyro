import { ScrollView, useWindowDimensions, View } from "react-native";
import { WelcomePhoto } from "./WelcomePhoto";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, Logo, Txt, useTheme } from "./ui";
import { useAppStore } from "../stores/useAppStore";
import type { AppLanguage } from "../i18n/language";

export function LanguagePicker({ onDone }: { onDone?: () => void }) {
  const c = useTheme();
  const { height } = useWindowDimensions();
  const select = (language: AppLanguage) => {
    useAppStore.getState().preferences({ language });
    onDone?.();
  };
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: onDone ? "center" : "flex-start",
        }}
      >
        <View style={{ alignSelf: "center", width: "100%", maxWidth: 540 }}>
          {!onDone && (
            <WelcomePhoto
              scene="trail"
              height={Math.max(160, Math.min(500, height * 0.5))}
            />
          )}
          <View style={{ padding: 24, gap: 14 }}>
            {onDone && <Logo width={152} color={c.text} />}
            <Txt size={28} weight="700" accessibilityRole="header">
              Choose your language
            </Txt>
            <Txt muted>Velg språk</Txt>
            <Button title="English" onPress={() => select("en")} />
            <Button
              secondary
              title="Norsk bokmål"
              onPress={() => select("nb")}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
