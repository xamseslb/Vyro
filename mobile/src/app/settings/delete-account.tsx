import { message as uiText } from "../../i18n/language";
import { useRef, useState } from "react";
import { useAppStore } from "../../stores/useAppStore";
import { Alert, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AccountGate } from "../../components/AccountGate";
import { Page } from "../../components/SettingsUi";
import { Button, Txt, useTheme } from "../../components/ui";
import { useAuthStore } from "../../stores/useAuthStore";
import { deleteOwnAccount } from "../../features/auth/deleteAccount";
export default function DeleteAccount() {
  const owner = useAuthStore((s) => s.session?.user.id);
  return (
    <AccountGate>{owner && <Form key={owner} owner={owner} />}</AccountGate>
  );
}
function Form({ owner }: { owner: string }) {
  const word = useAppStore((s) => s.language) === "en" ? "DELETE" : "SLETT";
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const lock = useRef(false);
  const c = useTheme();
  return (
    <Page title={uiText("Slett konto")} plain>
      <View style={{ padding: 22, gap: 20 }}>
        <Txt weight="700" size={22}>{uiText("Dette kan ikke angres")}</Txt>
        <Txt>{uiText("Kontoen, private sikkerhetskopier, bilder, innlegg, kommentarer, ruter og klubbene du eier blir slettet. Økter på denne enheten fjernes. Kopier du har eksportert eller lagret på andre enheter må slettes der.")}</Txt>
        <Txt muted>{uiText("Du må ha logget inn de siste 15 minuttene. Ta vare på økter du vil beholde under Data og sikkerhetskopi først.")}</Txt>
        <Button
          title={uiText("Til data og eksport")}
          secondary
          disabled={busy}
          onPress={() => router.push("/settings/data")}
        />
        <Txt>{uiText("Skriv SLETT for å bekrefte.")}</Txt>
        <TextInput
          accessibilityLabel={uiText("Bekreft kontosletting")}
          value={confirmation}
          onChangeText={setConfirmation}
          autoCorrect={false}
          maxLength={word.length}
          editable={!busy}
          autoCapitalize="characters"
          style={{
            color: c.text,
            borderColor: c.border,
            borderWidth: 1,
            borderRadius: 12,
            padding: 16,
          }}
        />
        <Button
          title={busy ? uiText("Sletter konto …") : uiText("Slett kontoen min permanent")}
          danger
          disabled={busy || confirmation !== word}
          onPress={async () => {
            if (lock.current) return;
            lock.current = true;
            setBusy(true);
            setError("");
            try {
              const result = await deleteOwnAccount(owner);
              if (!result.localCleanupComplete)
                Alert.alert(
                  uiText("Kontoen er slettet"),
                  uiText("Oppryddingen på denne enheten kunne ikke bekreftes. For å fjerne alle lokale kopier må du slette VYRO fra enheten. Ta først vare på eventuelle økter som tilhører andre kontoer."),
                );
              if (!useAuthStore.getState().session) router.replace("/account");
            } catch (e) {
              setError(
                e instanceof Error ? e.message : uiText("Kunne ikke slette kontoen."),
              );
            } finally {
              lock.current = false;
              setBusy(false);
            }
          }}
        />
        {!!error && <Txt accessibilityRole="alert">{error}</Txt>}
      </View>
    </Page>
  );
}
