import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePathname } from "expo-router";
import { useAuthStore } from "../stores/useAuthStore";
import {
  claimUsername,
  loadOwnProfile,
  useProfileStore,
} from "../stores/useProfileStore";
import { isGeneratedUsername } from "../features/social/display";
import { normalizeUsername, usernameProblem } from "../features/auth/username";
import { supabase } from "../lib/supabase";
import { preparePushSignOut } from "../features/social/push";
import { Button, Txt, useTheme } from "./ui";
import { UsernameField } from "./UsernameField";
import { BrandWordmark } from "./Brand";

export function UsernameGate() {
  const id = useAuthStore((s) => s.session?.user.id);
  const path = usePathname();
  return id && !path.startsWith("/auth/") ? <Choose key={id} id={id} /> : null;
}

function Choose({ id }: { id: string }) {
  const c = useTheme();
  const profile = useProfileStore((s) =>
    s.profile?.id === id ? s.profile : null,
  );
  const error = useProfileStore((s) => s.errorFor === id);
  const [attempt, retry] = useState(0);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const [message, setMessage] = useState("");
  const [known, setKnown] = useState(false);
  const cacheKey = "vyro-username-chosen:" + id;
  const chosen = !!profile && !isGeneratedUsername(profile.username);
  useEffect(() => {
    const controller = new AbortController();
    void loadOwnProfile(id, controller.signal, true);
    void AsyncStorage.getItem(cacheKey)
      .then((v) => {
        if (!controller.signal.aborted) setKnown(v === "1");
      })
      .catch(() => {});
    return () => controller.abort();
  }, [id, attempt, cacheKey]);
  useEffect(() => {
    if (chosen) void AsyncStorage.setItem(cacheKey, "1").catch(() => {});
  }, [chosen, cacheKey]);
  if (chosen || (!profile && known)) return null;
  async function act(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Prøv igjen.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal visible presentationStyle="fullScreen" onRequestClose={() => {}}>
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              padding: 24,
              gap: 20,
              justifyContent: "center",
              alignSelf: "center",
              width: "100%",
              maxWidth: 480,
            }}
          >
            <BrandWordmark width={112} color={c.text} />
            {profile ? (
              <>
                <Txt size={30} weight="700">
                  Velg brukernavnet ditt
                </Txt>
                <UsernameField
                  value={value}
                  onChange={setValue}
                  disabled={busy}
                />
                <Button
                  title={busy ? "Vent litt …" : "Lagre og fortsett"}
                  disabled={busy}
                  onPress={() =>
                    void act(async () => {
                      const handle = normalizeUsername(value);
                      const problem = usernameProblem(handle);
                      if (problem) throw new Error(problem);
                      await claimUsername(id, profile.username, handle);
                    })
                  }
                />
              </>
            ) : error ? (
              <>
                <Txt>Kunne ikke hente profilen din.</Txt>
                <Button
                  title="Prøv igjen"
                  onPress={() => retry((n) => n + 1)}
                />
              </>
            ) : (
              <ActivityIndicator accessibilityLabel="Henter profil" />
            )}
            {!!message && (
              <View accessibilityLiveRegion="polite">
                <Txt>{message}</Txt>
              </View>
            )}
            <Button
              secondary
              title="Logg ut"
              disabled={busy}
              onPress={() =>
                void act(async () => {
                  await preparePushSignOut(id);
                  const result = await supabase!.auth.signOut({
                    scope: "local",
                  });
                  if (result.error)
                    throw new Error("Kunne ikke logge ut. Prøv igjen.");
                })
              }
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
