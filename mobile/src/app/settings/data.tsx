import { message as uiText } from "../../i18n/language";
import { useState } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import {
  Page,
  PageNote,
  SettingsGroup,
  SettingsRow,
} from "../../components/SettingsUi";
import { BackupSettings } from "../../components/BackupSettings";
import { Button, Txt } from "../../components/ui";
import { appPersistence, useAppStore } from "../../stores/useAppStore";
import { useAuthStore } from "../../stores/useAuthStore";
export default function DataSettings() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const error = useAppStore((s) => s.storageError);
  const [busy, setBusy] = useState(false);
  return (
    <Page title={uiText("Data og sikkerhetskopi")}>
      {!!error && (
        <View style={{ padding: 22, gap: 12 }}>
          <Txt>{error}</Txt>
          <Button
            title={busy ? uiText("Prøver igjen …") : uiText("Prøv lokal lagring igjen")}
            disabled={busy}
            onPress={() => {
              setBusy(true);
              void appPersistence.retry().finally(() => setBusy(false));
            }}
          />
        </View>
      )}
      <SettingsGroup title={uiText("På denne enheten")}>
        <SettingsRow
          title={uiText("Din treningslogg")}
          description={uiText("Se og administrer lagrede økter.")}
          icon="chart"
          onPress={() =>
            router.push({ pathname: "/profile", params: { tab: "activities" } })
          }
        />
        <SettingsRow
          title={uiText("Eksporter en rute")}
          description={uiText("Åpne en GPS-økt i treningsloggen og velg GPX-eksport.")}
          icon="share"
          onPress={() =>
            router.push({ pathname: "/profile", params: { tab: "activities" } })
          }
        />
      </SettingsGroup>
      {userId ? (
        <View style={{ padding: 22 }}>
          <BackupSettings key={userId} owner={userId} />
        </View>
      ) : (
        <SettingsGroup>
          <SettingsRow
            title={uiText("Logg inn for sikkerhetskopiering")}
            onPress={() => router.push("/account")}
          />
        </SettingsGroup>
      )}
      <PageNote>{uiText("En eksportert GPX-fil kan inneholde hele ruten. Del filen bare med dem du vil gi tilgang til den.")}</PageNote>
    </Page>
  );
}
