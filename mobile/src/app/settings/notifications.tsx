import { message as uiText } from "../../i18n/language";
import { useCallback, useRef, useState } from "react";
import { Linking, Switch, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { AccountGate } from "../../components/AccountGate";
import {
  Page,
  PageNote,
  SettingsGroup,
  SettingsRow,
} from "../../components/SettingsUi";
import { Button, Txt } from "../../components/ui";
import { useAuthStore } from "../../stores/useAuthStore";
import {
  disablePush,
  enablePush,
  pushStatus,
  pushSupported,
} from "../../features/social/push";
import { socialError } from "../../features/social/api";
import { NotificationCategories } from "../../components/NotificationCategories";
export default function SocialNotificationSettings() {
  const owner = useAuthStore((s) => s.session?.user.id);
  return (
    <AccountGate>
      {owner && <Preferences key={owner} owner={owner} />}
    </AccountGate>
  );
}
function Preferences({ owner }: { owner: string }) {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const lock = useRef(false);
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      setBusy(true);
      void pushStatus(owner)
        .then((value) => {
          if (alive) setEnabled(value);
        })
        .catch(() => {
          if (alive) setError(uiText("Kunne ikke sjekke varslene. Prøv igjen."));
        })
        .finally(() => {
          if (alive) setBusy(false);
        });
      return () => {
        alive = false;
      };
    }, [owner]),
  );
  async function change(value: boolean) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      if (value) await enablePush(owner);
      else await disablePush(owner);
      setEnabled(value);
    } catch (e) {
      setError(e instanceof Error ? e.message : socialError(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Page title={uiText("Sosiale varsler")}>
      <PageNote>{uiText("Følg med på følgerne dine, kommentarer, likerklikk og nye innlegg.")}</PageNote>
      <SettingsGroup title={uiText("På denne telefonen")}>
        <SettingsRow
          title={uiText("Varsler på telefonen")}
          description={uiText("Få varsel også når VYRO er lukket. Varselet inneholder ingen treningsrute eller posisjon.")}
          end={
            <Switch
              accessibilityLabel={uiText("Varsler på telefonen")}
              value={enabled}
              disabled={busy || !pushSupported}
              onValueChange={(v) => void change(v)}
            />
          }
        />
        <SettingsRow
          title={uiText("Åpne varsellisten")}
          icon="bell"
          onPress={() => router.push("/notifications")}
        />
        {pushSupported && (
          <SettingsRow
            title={uiText("Telefonens varselinnstillinger")}
            onPress={() => void Linking.openSettings()}
          />
        )}
      </SettingsGroup>
      {!pushSupported && (
        <PageNote>{uiText("Telefonvarsler kan slås på i den installerte VYRO-appen på iPhone.")}</PageNote>
      )}
      <NotificationCategories key={owner} owner={owner} />
      <View style={{ padding: 22, gap: 12 }}>
        {!!error && (
          <>
            <Txt accessibilityRole="alert">{error}</Txt>
            <Button
              title={uiText("Prøv igjen")}
              secondary
              disabled={busy}
              onPress={() => void change(!enabled)}
            />
          </>
        )}
        <Txt muted size={13}>
          iPhone bestemmer hvordan varsler vises på låseskjermen. Fokus og
          varselinnstillinger kan dempe dem.
        </Txt>
      </View>
    </Page>
  );
}
