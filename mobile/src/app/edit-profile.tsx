import { message as uiText } from "../i18n/language";
import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Pressable, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AccountGate } from "../components/AccountGate";
import { Page, SettingsGroup } from "../components/SettingsUi";
import ProfilePhotoEditor from "../components/ProfilePhotoEditor";
import { Button, Chip, Txt, useTheme } from "../components/ui";
import { useAuthStore } from "../stores/useAuthStore";
import { useOwnProfile } from "../features/auth/useOwnProfile";
import { loadOwnProfile } from "../stores/useProfileStore";
import {
  profileDetails,
  saveProfileDetails,
  validateProfileDetails,
} from "../features/auth/profileDetails";
import SportPicker from "../components/SportPicker";
import { selectableSports } from "../features/activities/sports";

export default function EditProfileScreen() {
  const user = useAuthStore((s) => s.session?.user);
  const { profile, failed } = useOwnProfile();
  return (
    <AccountGate>
      {user &&
        (profile ? (
          <ProfileForm key={user.id} user={user} />
        ) : (
          <Page title={uiText("Rediger profil")} fallback="/profile">
            <View style={{ padding: 22, gap: 14 }}>
              <Txt>
                {failed ? uiText("Kunne ikke hente profilen din.") : uiText("Henter profil …")}
              </Txt>
              {failed && (
                <Button
                  title={uiText("Prøv igjen")}
                  onPress={() =>
                    void loadOwnProfile(
                      user.id,
                      new AbortController().signal,
                      true,
                    )
                  }
                />
              )}
            </View>
          </Page>
        ))}
    </AccountGate>
  );
}
function ProfileForm({ user }: { user: User }) {
  const { profile } = useOwnProfile();
  const [draft, setDraft] = useState(() => {
    const details = profileDetails(user, profile?.display_name);
    return {
      ...details,
      selectedSports: details.selectedSports.filter((sport) =>
        selectableSports.includes(sport),
      ),
    };
  });
  const [selectSports, setSelectSports] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const c = useTheme();
  async function save() {
    if (lock.current) return;
    const validation = validateProfileDetails(draft);
    if (validation) {
      setError(validation);
      return;
    }
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await saveProfileDetails(user.id, draft);
      if (!mounted.current) return;
      if (router.canGoBack()) router.back();
      else router.replace("/profile");
    } catch (e) {
      setError(e instanceof Error ? e.message : uiText("Kunne ikke lagre profilen."));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const field = (
    key: "displayName" | "lastName" | "bio" | "city",
    label: string,
    max: number,
    multiline = false,
  ) => (
    <View
      style={{
        paddingHorizontal: 22,
        paddingVertical: 14,
        borderBottomWidth: 0.5,
        borderColor: c.border,
        gap: 7,
      }}
    >
      <Txt muted size={13}>
        {uiText(label)}
      </Txt>
      <TextInput
        accessibilityLabel={uiText(label)}
        placeholder={uiText(label)}
        placeholderTextColor={c.muted}
        editable={!busy}
        value={draft[key]}
        maxLength={max}
        multiline={multiline}
        autoCapitalize={key === "bio" ? "sentences" : "words"}
        onChangeText={(value) => setDraft({ ...draft, [key]: value })}
        style={{
          color: c.text,
          fontSize: 17,
          minHeight: multiline ? 76 : 30,
          textAlignVertical: "top",
          padding: 0,
        }}
      />
    </View>
  );
  return (
    <Page
      title={uiText("Rediger profil")}
      fallback="/profile"
      backDisabled={busy}
      right={
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          accessibilityState={{ disabled: busy }}
          onPress={() => void save()}
          style={{
            minHeight: 48,
            minWidth: 60,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Txt weight="700" style={{ color: c.accent }}>
            {busy ? uiText("Lagrer …") : uiText("Lagre")}
          </Txt>
        </Pressable>
      }
    >
      <ProfilePhotoEditor owner={user.id} name={draft.displayName || "V"} />
      {!!error && (
        <View
          accessibilityLiveRegion="polite"
          style={{ padding: 22, paddingBottom: 0 }}
        >
          <Txt>{error}</Txt>
        </View>
      )}
      <SettingsGroup
        title={uiText("Synlig for andre")}
        note={uiText("Dette navnet vises på profilen, innleggene og kommentarene dine.")}
      >
        {field("displayName", "Visningsnavn", 50)}
      </SettingsGroup>
      <SettingsGroup
        title={uiText("Om deg · privat")}
        note={uiText("Disse feltene er valgfrie og vises bare til deg. Etternavnet legges ikke til det offentlige profilnavnet.")}
      >
        {field("lastName", "Etternavn (valgfritt)", 50)}
        {field("bio", "Biografi (valgfritt)", 280, true)}
        {field("city", "Sted (valgfritt)", 80)}
      </SettingsGroup>
      <SettingsGroup title={uiText("Dine idretter")} note={uiText("Velg én, flere eller alle.")}>
        <View
          style={{
            padding: 22,
            gap: 12,
            flexDirection: "row",
            flexWrap: "wrap",
          }}
        >
          <Chip
            title={uiText("Alle")}
            selected={selectableSports.every((sport) =>
              draft.selectedSports.includes(sport),
            )}
            onPress={() => {
              if (!busy)
                setDraft({ ...draft, selectedSports: [...selectableSports] });
            }}
          />
          <Button
            title={uiText("Velg idretter ({0})", draft.selectedSports.length)}
            secondary
            disabled={busy}
            onPress={() => setSelectSports(true)}
          />
          <Txt muted size={13}>
            {draft.selectedSports.join(" · ") || uiText("Ingen valgt")}
          </Txt>
        </View>
      </SettingsGroup>
      {selectSports && (
        <SportPicker
          multiple
          selected={draft.selectedSports}
          onSelect={(sport) =>
            setDraft((d) => ({
              ...d,
              selectedSports: d.selectedSports.includes(sport)
                ? d.selectedSports.filter((s) => s !== sport)
                : [...d.selectedSports, sport],
            }))
          }
          onClose={() => setSelectSports(false)}
        />
      )}
      <View style={{ padding: 22 }}>
        <Button
          title={busy ? uiText("Lagrer profil …") : uiText("Lagre profil")}
          disabled={busy}
          onPress={() => void save()}
        />
      </View>
    </Page>
  );
}
