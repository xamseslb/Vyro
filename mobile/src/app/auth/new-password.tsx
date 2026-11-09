import { message as uiText } from "../../i18n/language";
import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { router } from "expo-router";
import { Button, Txt, useTheme } from "../../components/ui";
import { Page } from "../../components/SettingsUi";
import { supabase } from "../../lib/supabase";
import { useAuthStore } from "../../stores/useAuthStore";
import {
  authErrorMessage,
  validatePassword,
} from "../../features/auth/validation";

export default function NewPassword() {
  const session = useAuthStore((s) => s.session);
  const c = useTheme();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const pending = useRef(false);
  async function save() {
    if (!supabase || !session || pending.current) return;
    const validation = validatePassword(password, confirmation);
    if (validation) {
      setMessage(validation);
      return;
    }
    pending.current = true;
    setBusy(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setPassword("");
      setConfirmation("");
      router.replace("/account");
    } catch (error) {
      setMessage(authErrorMessage(error));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }
  return (
    <Page title={uiText("Velg nytt passord")} fallback="/settings/account" plain>
      <View style={{ padding: 22, gap: 18 }}>
        {session ? (
          <>
            <Txt muted>{uiText("Bruk minst 8 tegn.")}</Txt>
            {(["Nytt passord", "Bekreft nytt passord"] as const).map(
              (label, index) => (
                <TextInput
                  key={label}
                  accessibilityLabel={label}
                  placeholder={label}
                  placeholderTextColor={c.muted}
                  value={index ? confirmation : password}
                  onChangeText={index ? setConfirmation : setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="new-password"
                  editable={!busy}
                  style={{
                    borderColor: c.border,
                    borderWidth: 1,
                    borderRadius: 12,
                    padding: 16,
                    color: c.text,
                    fontSize: 16,
                  }}
                />
              ),
            )}
            {!!message && (
              <View accessibilityLiveRegion="polite">
                <Txt>{message}</Txt>
              </View>
            )}
            <Button
              title={busy ? uiText("Lagrer passord …") : uiText("Lagre nytt passord")}
              disabled={busy}
              onPress={() => void save()}
            />
          </>
        ) : (
          <Txt>{uiText("Åpne en ny tilbakestillingslenke fra e-posten din på denne enheten.")}</Txt>
        )}
        <Button
          secondary
          title={uiText("Til konto")}
          disabled={busy}
          onPress={() => router.replace("/account")}
        />
      </View>
    </Page>
  );
}
