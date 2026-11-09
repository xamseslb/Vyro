import { message as uiText } from "../i18n/language";
import { useCallback, useState } from "react";
import { Switch, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { AccountGate } from "../components/AccountGate";
import { Page, SettingsGroup, SettingsRow } from "../components/SettingsUi";
import { Button, Icon, Txt, useTheme } from "../components/ui";
import { useAppStore } from "../stores/useAppStore";
import { useAuthStore } from "../stores/useAuthStore";
import {
  setWatchEnabled,
  syncWatch,
  useWatchStatus,
  watchSupported,
} from "../features/watch/sync";
import { brand } from "../theme/tokens";

export default function AppleWatch() {
  const user = useAuthStore((s) => s.session?.user.id);
  return (
    <AccountGate>
      {user && <WatchSettings key={user} user={user} />}
    </AccountGate>
  );
}
function WatchSettings({ user }: { user: string }) {
  const c = useTheme();
  const enabled = useAppStore((s) => s.watchOwners.includes(user));
  const { paired, installed, checked, busy, error, imported } =
    useWatchStatus();
  const [changing, setChanging] = useState(false);
  const [localError, setLocalError] = useState("");
  useFocusEffect(
    useCallback(() => {
      void syncWatch();
    }, []),
  );
  const ready = watchSupported && checked && paired && installed;
  const title = !watchSupported
    ? uiText("Åpne på iPhone")
    : !checked
      ? uiText("Sjekker tilkoblingen …")
      : !paired
        ? uiText("Ingen Apple Watch tilkoblet")
        : !installed
          ? uiText("Installer VYRO på klokken")
          : enabled
            ? uiText("Klar for neste tur")
            : uiText("Apple Watch er klar");
  const description = !watchSupported
    ? uiText("Klokketilkoblingen krever den installerte VYRO-appen på iPhone.")
    : !checked
      ? uiText("Ha klokken og telefonen i nærheten av hverandre.")
      : !paired
        ? uiText("Koble klokken til iPhonen i Apples Watch-app først.")
        : !installed
          ? uiText("Åpne Watch-appen på iPhone og installer VYRO under tilgjengelige apper.")
          : enabled
            ? uiText("Start økten i VYRO på klokken. Lagrede økter overføres til denne kontoen.")
            : uiText("Slå på tilkoblingen nedenfor for å bruke denne kontoen på klokken.");
  return (
    <Page title="Apple Watch">
      <View style={{ padding: 16, gap: 16 }}>
        <View
          style={{
            backgroundColor: brand.navy,
            borderRadius: 24,
            padding: 24,
            gap: 14,
          }}
        >
          <Icon name="device" size={42} color={brand.lime} />
          <Txt size={25} weight="700" style={{ color: "white" }}>
            {uiText(title)}
          </Txt>
          <Txt size={15} style={{ color: "#D1D7E4" }}>
            {uiText(description)}
          </Txt>
        </View>
        {watchSupported && (
          <Button
            title={busy ? uiText("Sjekker …") : uiText("Sjekk tilkoblingen")}
            secondary
            icon="refresh"
            disabled={busy || changing}
            onPress={() => {
              setLocalError("");
              void syncWatch();
            }}
          />
        )}
        {!!(localError || error) && (
          <Txt accessibilityRole="alert">{localError || error}</Txt>
        )}
      </View>
      <SettingsGroup
        title={uiText("Din konto")}
        note={
          !ready && !enabled
            ? uiText("Bryteren blir tilgjengelig når VYRO er installert på en sammenkoblet Apple Watch.")
            : uiText("Øktene lagres privat. Du velger selv om de skal deles.")
        }
      >
        <SettingsRow
          title={uiText("Bruk VYRO på Apple Watch")}
          description={
            enabled && !ready
              ? uiText("Aktivert for kontoen. Venter på klokken.")
              : uiText("Koble denne kontoen til klokken.")
          }
          end={
            <Switch
              accessibilityLabel={uiText("Bruk VYRO på Apple Watch")}
              value={enabled}
              accessibilityState={{ disabled: busy || changing || (!ready && !enabled), checked: enabled }}
              disabled={busy || changing || (!ready && !enabled)}
              trackColor={{ true: c.accent }}
              onValueChange={(value) => {
                setChanging(true);
                setLocalError("");
                void setWatchEnabled(user, value)
                  .catch((e) =>
                    setLocalError(
                      e instanceof Error
                        ? e.message
                        : uiText("Kunne ikke endre tilkoblingen."),
                    ),
                  )
                  .finally(() => setChanging(false));
              }}
            />
          }
        />
      </SettingsGroup>
      {ready && enabled && (
        <View style={{ padding: 20, gap: 10 }}>
          <Button
            title={busy ? uiText("Synkroniserer …") : uiText("Synkroniser nå")}
            disabled={busy || changing}
            onPress={() => void syncWatch()}
          />
          {imported > 0 && (
            <Txt muted size={13}>
              {imported} {imported === 1 ? uiText("økt overført") : uiText("økter overført")}{" "}{uiText("til treningsloggen.")}</Txt>
          )}
        </View>
      )}
      <View
        style={{
          margin: 16,
          padding: 22,
          borderRadius: 24,
          backgroundColor: c.surface,
          gap: 20,
        }}
      >
        <Txt size={20} weight="700">{uiText("Slik bruker du klokken")}</Txt>
        {[
          [
            "1",
            "Velg idrett og start",
            "Åpne VYRO på Apple Watch. Gi tilgang til Helse og posisjon når klokken spør.",
          ],
          [
            "2",
            "Følg økten på håndleddet",
            "Se tid, distanse og puls. Pause, fortsett og avslutt direkte på klokken.",
          ],
          [
            "3",
            "Lagre og se turen på iPhone",
            "Åpne VYRO på iPhone etter turen. Kopien beholdes på klokken til telefonen har lagret den.",
          ],
        ].map(([number, heading, body]) => (
          <View key={number} style={{ flexDirection: "row", gap: 14 }}>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: c.raised,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Txt weight="700">{number}</Txt>
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <Txt weight="600">{heading}</Txt>
              <Txt muted size={14}>
                {body}
              </Txt>
            </View>
          </View>
        ))}
      </View>
    </Page>
  );
}
