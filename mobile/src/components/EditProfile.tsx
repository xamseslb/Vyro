import { message as uiText } from "../i18n/language";
import { useRef, useState } from "react";
import { TextInput, View } from "react-native";
import { Button, Txt, useTheme } from "./ui";
import { useOwnProfile } from "../features/auth/useOwnProfile";
import { loadOwnProfile, saveDisplayName } from "../stores/useProfileStore";

export function EditProfile({ userId }: { userId: string }) {
  const { profile, failed } = useOwnProfile();
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const pending = useRef(false);
  const c = useTheme();
  const value = draft ?? profile?.display_name ?? "";
  return (
    <View style={{ gap: 12 }}>
      <Txt weight="600">{uiText("Visningsnavn på kontoen")}</Txt>
      {!profile ? (
        <>
          <Txt muted>
            {failed ? uiText("Kunne ikke hente profilen.") : uiText("Henter profil …")}
          </Txt>
          {failed && (
            <Button
              title={uiText("Hent profil på nytt")}
              secondary
              onPress={() => {
                void loadOwnProfile(userId, new AbortController().signal, true);
              }}
            />
          )}
        </>
      ) : (
        <>
          <TextInput
            accessibilityLabel={uiText("Visningsnavn på kontoen")}
            value={value}
            maxLength={50}
            editable={!busy}
            onChangeText={(name) => {
              setDraft(name);
              setMessage("");
            }}
            style={{
              color: c.text,
              fontSize: 18,
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderColor: c.border,
            }}
          />
          <Txt size={13} muted>{uiText("Navnet vises på profilen din, innleggene og kommentarene dine.")}</Txt>
          <Button
            title={busy ? uiText("Lagrer navn …") : uiText("Lagre kontonavn")}
            disabled={
              busy || !value.trim() || value.trim() === profile.display_name
            }
            onPress={async () => {
              if (pending.current) return;
              pending.current = true;
              setBusy(true);
              setMessage("");
              try {
                await saveDisplayName(userId, value);
                setDraft(null);
                setMessage(uiText("Kontonavnet er lagret."));
              } catch (error) {
                setMessage(
                  error instanceof Error
                    ? error.message
                    : uiText("Kunne ikke lagre navnet. Prøv igjen."),
                );
              } finally {
                pending.current = false;
                setBusy(false);
              }
            }}
          />
          {!!message && <Txt>{message}</Txt>}
        </>
      )}
    </View>
  );
}
