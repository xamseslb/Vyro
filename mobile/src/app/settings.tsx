import { message as uiText } from "../i18n/language";
import { personName } from "../features/social/display";
import { preparePushSignOut } from "../features/social/push";
import { useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Page, SettingsGroup, SettingsRow } from "../components/SettingsUi";
import { Avatar } from "../components/SocialUi";
import { Txt, useTheme } from "../components/ui";
import { useAppStore } from "../stores/useAppStore";
import { acceptAuthSession, useAuthStore } from "../stores/useAuthStore";
import { useOwnProfile } from "../features/auth/useOwnProfile";
import { authErrorMessage } from "../features/auth/validation";
import { supabase } from "../lib/supabase";

export default function Settings() {
  const { session, ready } = useAuthStore();
  const { profile } = useOwnProfile();
  const language = useAppStore((s) => s.language);
  const theme = useAppStore((s) => s.theme);
  const localName = useAppStore((s) => s.name);
  const mapKind = useAppStore((s) => s.defaultMapKind ?? "standard");
  const pending = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const c = useTheme();
  const name = personName(
    profile?.display_name ??
    session?.user.user_metadata?.display_name ??
    uiText("Din profil"));
  return (
    <Page title={uiText("Innstillinger")} fallback="/profile">
      {session ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={uiText("Rediger profil")}
          onPress={() => router.push("/edit-profile")}
          style={{
            flexDirection: "row",
            gap: 14,
            alignItems: "center",
            padding: 22,
            backgroundColor: c.surface,
          }}
        >
          <Avatar name={name} path={profile?.avatar_path} size={60} />
          <View style={{ flex: 1, gap: 5 }}>
            <Txt size={20} weight="700">
              {name}
            </Txt>
            <Txt muted size={13}>{uiText("Rediger profil og kontoinformasjon")}</Txt>
          </View>
        </Pressable>
      ) : (
        <SettingsGroup>
          <SettingsRow
            title={ready ? uiText("Logg inn eller opprett konto") : uiText("Laster konto …")}
            description={uiText("Ta vare på turene dine og finn venner.")}
            icon="user"
            disabled={!ready}
            onPress={() => router.push("/account")}
          />
        </SettingsGroup>
      )}
      <SettingsGroup title={uiText("Konto")}>
        <SettingsRow title={uiText("Sosiale varsler")} description={uiText("Følgere, innlegg, liker og kommentarer")} icon="bell" onPress={()=>router.push("/settings/notifications")}/>
        <SettingsRow
          title={session ? uiText("Konto og sikkerhet") : uiText("Innlogging")}
          description={session?.user.email}
          icon="lock"
          onPress={() =>
            router.push(session ? "/settings/account" : "/account")
          }
        />
        <SettingsRow
          title={uiText("Personvern og deling")}
          icon="people"
          onPress={() => router.push("/settings/privacy")}
        />
        <SettingsRow
          title={uiText("Data og sikkerhetskopi")}
          icon="cloud"
          onPress={() => router.push("/settings/data")}
        />
      </SettingsGroup>
      {!session && ready && (
        <SettingsGroup
          title={uiText("Gjest")}
          note={uiText("Navnet lagres bare på denne enheten. Det oppretter ingen konto.")}
        >
          <View style={{ padding: 22, gap: 10 }}>
            <Txt muted size={13}>{uiText("Lokalt visningsnavn")}</Txt>
            <TextInput
              accessibilityLabel={uiText("Lokalt visningsnavn")}
              value={localName}
              onChangeText={(name) =>
                useAppStore.getState().preferences({ name })
              }
              maxLength={30}
              placeholder={uiText("Ditt navn")}
              placeholderTextColor={c.muted}
              style={{
                minHeight: 44,
                color: c.text,
                fontSize: 17,
                borderBottomWidth: 1,
                borderColor: c.border,
              }}
            />
          </View>
        </SettingsGroup>
      )}
      <SettingsGroup title={uiText("Din VYRO")}>
        <SettingsRow title={uiText("Språk")} value={language === "en" ? "English" : "Norsk bokmål"} icon="globe" onPress={() => router.push("/settings/language")} />
        <SettingsRow
          title={uiText("Utseende")}
          value={
            theme === "system"
              ? uiText("Følg telefonen")
              : theme === "dark"
                ? uiText("Mørkt")
                : uiText("Lyst")
          }
          icon="sun"
          onPress={() => router.push("/settings/appearance")}
        />
        <SettingsRow
          title={uiText("Standardkart")}
          value={
            { standard: "Standard", satellite: "Satellitt", hybrid: "Hybrid" }[
              mapKind
            ]
          }
          icon="layers"
          onPress={() => router.push("/settings/maps")}
        />
        <SettingsRow
          title={uiText("Hjem og innhold")}
          description={uiText("Velg strøm og visning av eksempler")}
          icon="home"
          onPress={() => router.push("/settings/feed")}
        />
        <SettingsRow title={uiText("Måleenheter")} value="km · min/km" />
      </SettingsGroup>
      <SettingsGroup title={uiText("Trening")}>
        <SettingsRow
          title={uiText("Varsler og opptak")}
          description={uiText("Kilometervarsler, skjerm og bakgrunnsopptak")}
          icon="bell"
          onPress={() => router.push("/training-settings")}
        />
        <SettingsRow
          title={uiText("Treningsmål")}
          description={uiText("Sett ditt eget mål for uken")}
          icon="chart"
          onPress={() => router.push("/training-goal")}
        />
        <SettingsRow
          title="Apple Watch"
          description={uiText("Klokke og synkronisering")}
          icon="device"
          onPress={() => router.push("/apple-watch")}
        />
      </SettingsGroup>
      <SettingsGroup title={uiText("Hjelp")}>
        <SettingsRow
          title={uiText("Hjelp og om VYRO")}
          description={uiText("GPS, konto og vanlige spørsmål")}
          icon="info"
          onPress={() => router.push("/settings/help")}
        />
      </SettingsGroup>
      {session && (
        <View style={{ padding: 22, gap: 12 }}>
          {!!error && <Txt>{error}</Txt>}
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: busy }}
            disabled={busy}
            onPress={async () => {
              if (pending.current || !supabase) return;
              pending.current = true;
              setBusy(true);
              setError("");
              try {
                await preparePushSignOut(session.user.id);
                const { error: failure } = await supabase.auth.signOut({
                  scope: "local",
                });
                if (failure) throw failure;
                acceptAuthSession(null);
                useAuthStore.setState({ confirmationEmail: null });
                router.replace("/(tabs)");
              } catch (e) {
                setError(authErrorMessage(e));
              } finally {
                pending.current = false;
                setBusy(false);
              }
            }}
            style={{
              borderWidth: 1,
              borderColor: c.border,
              borderRadius: 28,
              padding: 16,
              alignItems: "center",
              backgroundColor: c.surface,
            }}
          >
            <Txt
              weight="700"
              style={{ color: c.bg === "#0B1120" ? "#FF8D79" : "#B33A28" }}
            >
              {busy ? uiText("Logger ut …") : uiText("Logg ut")}
            </Txt>
          </Pressable>
        </View>
      )}
      <Txt muted size={12} style={{ textAlign: "center", paddingTop: 16 }}>{uiText("VYRO · Ta turen videre.")}</Txt>
    </Page>
  );
}
