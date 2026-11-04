import { useState } from "react";
import { Pressable, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import WorkoutMap from "../../components/WorkoutMap";
import FootballMap from "../../components/FootballMap";
import WorkoutOverview from "../../components/WorkoutOverview";
import { ExportWorkout } from "../../components/ExportWorkout";
import { Page } from "../../components/SettingsUi";
import {
  Button,
  Icon,
  Screen,
  Txt,
  styles,
  useTheme,
} from "../../components/ui";
import { useAppStore } from "../../stores/useAppStore";
import { useVisibleWorkouts } from "../../features/activities/useVisibleWorkouts";
import { duration, isRecordedWorkout } from "../../features/activities/model";

export default function Activity() {
  const { id, saved } = useLocalSearchParams<{ id: string; saved?: string }>();
  const remove = useAppStore((s) => s.remove);
  const workouts = useVisibleWorkouts();
  const [repeatError, setRepeatError] = useState(false);
  const [more, setMore] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const c = useTheme();
  const w = workouts.find((item) => item.id === id);
  const back = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/profile");
  };
  if (!w)
    return (
      <Screen>
        <Txt size={24}>Økten finnes ikke.</Txt>
        <Button
          title="Til historikken"
          onPress={() => router.replace("/(tabs)/profile")}
        />
      </Screen>
    );
  const recorded = isRecordedWorkout(w);
  const openComposer = () => {
    router.setParams({ saved: undefined });
    router.push({
      pathname: "/share-workout",
      params: { workoutId: w.id, audience: "followers" },
    });
  };
  return (
    <Page
      title={saved === "1" ? "Økten er lagret" : "Øktdetaljer"}
      plain
      onBack={back}
      footer={
        recorded && (
          <>
            <Button title="Lag innlegg" icon="share" onPress={openComposer} />
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace("/(tabs)/profile")}
              style={{
                minHeight: 44,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Txt weight="600">
                {saved === "1" ? "Behold privat" : "Til treningsloggen"}
              </Txt>
            </Pressable>
          </>
        )
      }
    >
      <View style={{ padding: 20, gap: 24 }}>
        <WorkoutOverview workout={w} />
        {w.route && w.route.length > 1 && (
          <View style={{ borderRadius: 20, overflow: "hidden" }}>
            {w.sport === "Fotball" && w.source === "gps" ? (
              <FootballMap key={w.id} points={w.route} />
            ) : (
              <WorkoutMap points={w.route} />
            )}
          </View>
        )}
        <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
          <Icon name="record" size={18} color={c.muted} />
          <Txt muted size={14}>
            {w.workoutType || "Vanlig økt"}
          </Txt>
        </View>
        {!!w.splits?.length && (
          <View style={{ gap: 14 }}>
            <Txt weight="700">Kilometertider</Txt>
            {w.splits.map((split) => (
              <View key={split.kilometer} style={styles.row}>
                <Txt>Km {split.kilometer}</Txt>
                <Txt>{duration(split.seconds)}</Txt>
              </View>
            ))}
          </View>
        )}
        {(!!w.notes || w.effort !== undefined) && (
          <View
            style={{
              gap: 10,
              borderTopWidth: 1,
              borderColor: c.border,
              paddingTop: 20,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Icon name="lock" size={16} color={c.muted} />
              <Txt weight="600">Dine notater</Txt>
            </View>
            {!!w.notes && <Txt>{w.notes}</Txt>}
            {w.effort !== undefined && (
              <Txt muted size={14}>
                Anstrengelse: {w.effort} av 10
              </Txt>
            )}
            <Txt muted size={12}>
              Bare du ser dette, også når du deler økten.
            </Txt>
          </View>
        )}
        {recorded && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Del med følgerne dine"
            accessibilityHint="Åpner forhåndsvisning før du publiserer."
            onPress={openComposer}
            style={({ pressed }) => ({
              backgroundColor: pressed ? c.raised : c.surface,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: c.border,
              padding: 18,
              flexDirection: "row",
              gap: 14,
              alignItems: "center",
            })}
          >
            <View
              style={{
                backgroundColor: c.raised,
                padding: 12,
                borderRadius: 16,
              }}
            >
              <Icon name="people" color={c.accent} />
            </View>
            <View style={{ flex: 1, gap: 5 }}>
              <Txt size={17} weight="700">
                Del med følgerne dine
              </Txt>
              <Txt size={14} muted>
                Lag et innlegg av økten. Du ser over det før du deler.
              </Txt>
            </View>
            <Icon name="chevronRight" size={20} color={c.accent} />
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: more }}
          onPress={() => setMore(!more)}
          style={{
            ...styles.row,
            minHeight: 48,
            borderTopWidth: 1,
            borderColor: c.border,
            paddingTop: 10,
          }}
        >
          <Txt weight="600" muted>
            Flere valg
          </Txt>
          <Icon
            name={more ? "chevronUp" : "chevronDown"}
            color={c.muted}
            size={20}
          />
        </Pressable>
        {more && (
          <View style={{ gap: 14 }}>
            {w.source === "gps" && !!w.route && w.route.length > 1 && (
              <>
                <Button
                  title="Gjenta denne ruten"
                  icon="map"
                  secondary
                  onPress={() => {
                    if (useAppStore.getState().repeatRoute(w))
                      router.push("/(tabs)/track");
                    else setRepeatError(true);
                  }}
                />
                {repeatError && (
                  <Txt muted>
                    Fullfør den pågående økten før du velger en ny rute.
                  </Txt>
                )}
              </>
            )}
            <ExportWorkout key={w.id} workout={w} />
            {w.source === "gps" && w.sport === "Løping" && (
              <Button
                title={w.turfId ? "Send soneforsøk" : "Legg ut som sone"}
                icon="trophy"
                secondary
                onPress={() =>
                  router.push({
                    pathname: "/turf",
                    params: {
                      workoutId: w.id,
                      ...(w.turfId ? { turfId: w.turfId } : {}),
                    },
                  })
                }
              />
            )}
            {confirm && (
              <Txt muted size={13}>
                Økten fjernes fra denne enheten. Eventuell sikkerhetskopi og
                delte innlegg beholdes. Du kan trekke tilbake innlegg fra Hjem.
              </Txt>
            )}
            <Button
              title={confirm ? "Bekreft sletting" : "Slett fra denne enheten"}
              secondary={!confirm}
              danger={confirm}
              onPress={() => {
                if (!confirm) setConfirm(true);
                else {
                  remove(w.id);
                  router.replace("/(tabs)/profile");
                }
              }}
            />
            {confirm && (
              <Button
                title="Avbryt sletting"
                secondary
                onPress={() => setConfirm(false)}
              />
            )}
          </View>
        )}
      </View>
    </Page>
  );
}
