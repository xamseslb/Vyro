import { message as uiText } from "../i18n/language";
import { useState } from "react";
import { Linking, Platform, Switch, View } from "react-native";
import { Button, Txt, styles } from "./ui";
import { useAppStore } from "../stores/useAppStore";
import { backgroundSupported } from "../features/tracking/background";
import { WorkoutLockScreenSetting } from "./WorkoutLockScreenSetting";

export function BackgroundRecordingSetting({
  compact = false,
}: {
  compact?: boolean;
}) {
  const enabled = useAppStore((s) => s.backgroundRecording);
  const recording = useAppStore((s) => s.recording.status !== "idle");
  const preferences = useAppStore((s) => s.preferences);
  const [settingsError, setSettingsError] = useState(false);
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.row}>
        <Txt weight="700" style={{ flex: 1 }}>{uiText("Fortsett med låst skjerm")}</Txt>
        {backgroundSupported && (
          <Switch
            accessibilityLabel={uiText("Fortsett med låst skjerm")}
            value={enabled}
            disabled={recording}
            onValueChange={(backgroundRecording) =>
              // Keep the separate map preference so off/on restores the user's
              // choice. The Live Activity observer gates it on background mode.
              preferences({ backgroundRecording })
            }
          />
        )}
      </View>
      <Txt muted size={14}>
        {backgroundSupported
          ? recording
            ? uiText("Avslutt økten før du endrer dette valget.")
            : enabled
              ? uiText("Registrer turen med skjermen låst eller mens du bruker andre apper. Start økten før du låser telefonen.")
              : uiText("Økten pauses hvis du låser skjermen eller bytter app.")
          : Platform.OS === "web"
            ? uiText("I nettleseren må VYRO være åpen under hele økten.")
            : uiText("Expo Go pauser opptaket når skjermen låses eller du bytter app. Dette krever en egen installasjon av VYRO, for eksempel via TestFlight.")}
      </Txt>
      {compact && backgroundSupported && enabled && (
        <WorkoutLockScreenSetting />
      )}
      {backgroundSupported && enabled && !recording && !compact && (
        <>
          <Button
            title={uiText("Åpne posisjonsinnstillinger")}
            secondary
            onPress={() => {
              setSettingsError(false);
              void Linking.openSettings().catch(() => setSettingsError(true));
            }}
          />
          <Txt muted size={12}>
            {Platform.OS === "ios"
              ? uiText("Velg VYRO → Posisjon → Når appen er i bruk (eller Alltid), og slå på Presis posisjon.")
              : uiText("Velg VYRO → Posisjon → Alltid og slå på Presis posisjon.")}{" "}{uiText("Telefonen må være på; ikke avslutt VYRO fra appveksleren.")}</Txt>
          {settingsError && (
            <Txt size={12}>{uiText("Åpne Innstillinger på telefonen og finn VYRO.")}</Txt>
          )}
        </>
      )}
    </View>
  );
}
