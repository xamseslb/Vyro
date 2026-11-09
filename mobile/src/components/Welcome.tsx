import { type ComponentRef, useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { message as t } from "../i18n/language";
import { useAppStore } from "../stores/useAppStore";
import { useAuthStore } from "../stores/useAuthStore";
import { Button, Icon, Txt, useTheme } from "./ui";
import { WelcomePhoto } from "./WelcomePhoto";

const slides = [
  {
    scene: "trail",
    title: "Finn folk å løpe med.",
    body: "Bli med i en klubb, del økter med følgerne dine og konkurrer om soner.",
  },
  {
    scene: "waterfront",
    title: "Følg turen fra første steg.",
    body: "Se tid og distanse mens du trener. Etterpå finner du ruten igjen i treningsloggen.",
  },
] as const;

export function Welcome({ standalone = false }: { standalone?: boolean }) {
  const c = useTheme();
  const { width, height, fontScale } = useWindowDimensions();
  const [measuredWidth, setMeasuredWidth] = useState<number>();
  const pageWidth = measuredWidth || Math.min(width, 540);
  const artHeight = Math.max(
    160,
    Math.min(500, height * (fontScale > 1.3 ? 0.33 : standalone ? 0.52 : 0.44)),
  );
  const [index, setIndex] = useState(0);
  const pager = useRef<ComponentRef<typeof ScrollView>>(null);
  const confirmation = useAuthStore((s) => s.confirmationEmail);
  const slide = slides[index];

  useEffect(() => {
    pager.current?.scrollTo({ x: index * pageWidth, animated: false });
  }, [pageWidth, index]);

  const open = (mode: "login" | "register") => {
    useAppStore.getState().preferences({ onboarded: true });
    router.push({ pathname: "/account", params: { mode } });
  };
  return (
    <SafeAreaView
      edges={
        standalone
          ? ["top", "left", "right", "bottom"]
          : ["top", "left", "right"]
      }
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View
          style={styles.column}
          onLayout={(e) => setMeasuredWidth(e.nativeEvent.layout.width)}
        >
          <ScrollView
            ref={pager}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            directionalLockEnabled
            style={{ height: artHeight, flexGrow: 0 }}
            onMomentumScrollEnd={(e) =>
              setIndex(
                Math.max(
                  0,
                  Math.min(
                    slides.length - 1,
                    Math.round(e.nativeEvent.contentOffset.x / pageWidth),
                  ),
                ),
              )
            }
          >
            {slides.map(({ scene }) => (
              <WelcomePhoto
                key={scene}
                scene={scene}
                height={artHeight}
                width={pageWidth}
              />
            ))}
          </ScrollView>
          <View style={styles.panel}>
            <View style={styles.indicators}>
              {slides.map((item, i) => (
                <Pressable
                  key={item.scene}
                  accessibilityRole="button"
                  accessibilityLabel={t(
                    "Vis introduksjon {0}: {1}",
                    i + 1,
                    t(item.title),
                  )}
                  accessibilityState={{ selected: i === index }}
                  onPress={() => setIndex(i)}
                  style={styles.dotTarget}
                >
                  <View
                    style={{
                      width: i === index ? 32 : 12,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: i === index ? c.accent : c.border,
                    }}
                  />
                </Pressable>
              ))}
            </View>
            <Txt
              accessibilityRole="header"
              size={30}
              weight="800"
              style={styles.title}
            >
              {t(slide.title)}
            </Txt>
            <Txt muted size={16}>
              {t(slide.body)}
            </Txt>
          </View>
          <View style={styles.actions}>
            {!!confirmation && (
              <Txt muted size={13}>
                {t(
                  "Fullfør innloggingen med e-postadressen din. En ny konto må bekreftes via e-post.",
                )}
              </Txt>
            )}
            <Button
              title={t("Opprett konto")}
              icon="chevronRight"
              onPress={() => open("register")}
            />
            <Button
              title={t("Logg inn")}
              secondary
              onPress={() => open("login")}
            />
            <Pressable
              accessibilityRole="button"
              style={styles.guest}
              onPress={() => {
                useAppStore.getState().preferences({ onboarded: true });
                router.push("/map");
              }}
            >
              <Icon name="map" size={16} color={c.muted} />
              <Txt muted size={14}>
                {t("Utforsk kartet")}
              </Txt>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: "center" },
  column: { width: "100%", maxWidth: 540, flexGrow: 1 },
  panel: { paddingHorizontal: 24, paddingBottom: 20, gap: 5 },
  indicators: { flexDirection: "row" },
  dotTarget: {
    minWidth: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  title: { letterSpacing: -0.8 },
  actions: {
    marginTop: "auto",
    paddingHorizontal: 24,
    paddingBottom: 8,
    gap: 8,
  },
  guest: {
    minHeight: 44,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
  },
});
