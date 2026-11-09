import { message as uiText } from "../i18n/language";
import { Switch, View } from "react-native";
import { Txt, styles } from "./ui";
import { useAppStore } from "../stores/useAppStore";
import { useTrackingStatus } from "../stores/useTrackingStatus";
import { liveActivitySupported } from "../features/tracking/liveActivitySupport";

export function WorkoutLockScreenSetting() {
  const enabled = useAppStore((s) => s.workoutLiveActivity);
  const background = useAppStore((s) => s.backgroundRecording);
  const recording = useAppStore((s) => s.recording.status !== "idle");
  const timerOnly = useAppStore((s) => s.recording.mode === "timer");
  const preferences = useAppStore((s) => s.preferences);
  const error = useTrackingStatus((s) => s.liveActivityError);
  if (!liveActivitySupported) return null;
  return (
    <View style={{ gap: 10 }}>
      <View style={styles.row}>
        <Txt style={{ flex: 1 }}>{uiText("Vis tid og km på låseskjermen")}</Txt>
        <Switch
          accessibilityLabel={uiText("Vis tid og km på låseskjermen")}
          value={enabled && (background || timerOnly)}
          disabled={recording && !background && !timerOnly}
          onValueChange={(workoutLiveActivity) =>
            preferences({
              workoutLiveActivity,
              ...(workoutLiveActivity && !recording && !timerOnly
                ? { backgroundRecording: true }
                : {}),
            })
          }
        />
      </View>
      <Txt muted size={14}>
        {timerOnly
          ? uiText("Tid og idrett blir synlige når telefonen er låst.")
          : recording && !background
            ? uiText("Avslutt økten og slå på opptak med låst skjerm for å vise økten.")
            : !background && enabled
              ? uiText("Valget ditt huskes. Slå på opptak med låst skjerm for å bruke det igjen.")
              : uiText("Tid, distanse og siste kartutsnitt blir synlige når telefonen er låst.")}
      </Txt>
      {error && <Txt size={14}>{error}</Txt>}
    </View>
  );
}
