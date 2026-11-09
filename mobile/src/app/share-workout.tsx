import { message as uiText, displayLocale } from "../i18n/language";
import { useEffect, useRef, useState } from "react";
import { Pressable, Switch, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Txt, Button, Icon, useTheme } from "../components/ui";
import { Page } from "../components/SettingsUi";
import SportIcon from "../components/SportIcon";
import WorkoutOverview from "../components/WorkoutOverview";
import WorkoutMap from "../components/WorkoutMap";
import FootballMap from "../components/FootballMap";
import { publicationRoute } from "../features/football/sharing";
import { useAppStore } from "../stores/useAppStore";
import { shareable } from "../stores/useSocialStore";
import { useAuthStore } from "../stores/useAuthStore";
import { publish, socialError } from "../features/social/api";
import { AccountGate } from "../components/AccountGate";
import { km, duration } from "../features/activities/model";
import {
  hasVisibleSegment,
  WORKOUT_SHARING_RADIUS_METERS,
} from "../features/social/routePrivacy";
import { useOwnProfile } from "../features/auth/useOwnProfile";
import { loadOwnProfile } from "../stores/useProfileStore";

export default function ShareWorkout() {
  const id = useAuthStore((s) => s.session?.user.id);
  const params = useLocalSearchParams<{
    workoutId?: string;
    audience?: string;
  }>();
  const workoutId =
    typeof params.workoutId === "string" ? params.workoutId : undefined;
  return (
    <AccountGate>
      {id && (
        <ShareForm
          key={id + ":" + (workoutId ?? "")}
          userId={id}
          workoutId={workoutId}
          followersFirst={params.audience === "followers"}
        />
      )}
    </AccountGate>
  );
}

function ShareForm({
  userId,
  workoutId,
  followersFirst,
}: {
  userId: string;
  workoutId?: string;
  followersFirst: boolean;
}) {
  const { profile, failed } = useOwnProfile();
  const c = useTheme();
  const workouts = useAppStore((s) => s.workouts);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<string | null>(workoutId ?? null);
  const [choosing, setChoosing] = useState(!workoutId);
  const [wholeRouteFor, setWholeRouteFor] = useState<string | null>(null);
  const [audience, setAudience] = useState<"followers" | "everyone">(() =>
    followersFirst
      ? "followers"
      : (useAppStore.getState().sharingAudienceByOwner?.[userId] ??
        "followers"),
  );
  const pending = useRef(false);
  const mounted = useRef(true);
  const profileRequest = useRef<AbortController | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      profileRequest.current?.abort();
    };
  }, []);
  const eligible = workouts.filter((w) => shareable(w) && w.ownerId === userId);
  const workout = eligible.find((w) => w.id === selected);
  const wholeRoute = !!workout && wholeRouteFor === workout.id;
  const route = publicationRoute(workout, wholeRoute);
  const canShare = workout?.source === "timer" || hasVisibleSegment(route);
  const effectiveAudience = profile?.is_private ? "followers" : audience;
  const back = () => {
    if (pending.current) return;
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)/profile");
  };
  const send = async () => {
    if (
      pending.current ||
      !workout ||
      !canShare ||
      !profile ||
      useAuthStore.getState().session?.user.id !== userId
    )
      return;
    // Recheck the selected record at the moment of publication.
    const current = useAppStore
      .getState()
      .workouts.find((w) => w.id === workout.id && w.ownerId === userId);
    if (!current || !shareable(current)) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      await publish(current, userId, effectiveAudience, wholeRoute);
      if (
        mounted.current &&
        useAuthStore.getState().session?.user.id === userId
      )
        router.replace("/(tabs)");
    } catch (e) {
      if (
        mounted.current &&
        useAuthStore.getState().session?.user.id === userId
      )
        setError(socialError(e));
    } finally {
      pending.current = false;
      if (mounted.current) setBusy(false);
    }
  };
  return (
    <Page
      title={uiText("Nytt innlegg")}
      plain
      onBack={back}
      backDisabled={busy}
      footer={
        workout &&
        !choosing && (
          <>
            {!!error && (
              <Txt accessibilityRole="alert" size={13}>
                {error}
              </Txt>
            )}
            <Button
              title={
                busy
                  ? uiText("Deler …")
                  : effectiveAudience === "followers"
                    ? uiText("Del med følgere")
                    : uiText("Publiser innlegg")
              }
              icon="share"
              disabled={busy || !canShare || !profile}
              onPress={() => void send()}
            />
            <Pressable
              accessibilityRole="button"
              disabled={busy}
              accessibilityState={{ disabled: busy }}
              onPress={back}
              style={{
                minHeight: 44,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Txt weight="600">{uiText("Avbryt")}</Txt>
            </Pressable>
          </>
        )
      }
    >
      <View style={{ padding: 20, gap: 24 }}>
        {(!workout || choosing) && (
          <View style={{ gap: 10 }}>
            <Txt size={20} weight="700">{uiText("Velg økt")}</Txt>
            {eligible.map((w) => (
              <Pressable
                key={w.id}
                accessibilityRole="button"
                accessibilityLabel={w.title}
                accessibilityState={{
                  selected: selected === w.id,
                  disabled: busy,
                }}
                disabled={busy}
                onPress={() => {
                  setSelected(w.id);
                  setChoosing(false);
                  setWholeRouteFor(null);
                  setError("");
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  borderRadius: 18,
                  backgroundColor: c.raised,
                  borderWidth: 1,
                  borderColor: selected === w.id ? c.accent : c.raised,
                }}
              >
                <SportIcon sport={w.sport} size={32} />
                <View style={{ flex: 1, gap: 4 }}>
                  <Txt weight="600">{w.title}</Txt>
                  <Txt size={12} muted>
                    {new Date(w.date).toLocaleDateString(displayLocale())} ·{" "}
                    {duration(w.seconds)}
                    {w.source === "gps" ? " · " + km(w.distance) + " km" : ""}
                  </Txt>
                </View>
                <Icon
                  name={selected === w.id ? "check" : "chevronRight"}
                  color={c.accent}
                  size={20}
                />
              </Pressable>
            ))}
            {!eligible.length && (
              <Txt muted>{uiText("Ingen delbare økter ennå. Fullfør og lagre en økt først.")}</Txt>
            )}
            {workoutId && !workout && (
              <Txt accessibilityRole="alert">{uiText("Denne økten er ikke tilgjengelig for deling. Velg en av dine lagrede økter.")}</Txt>
            )}
          </View>
        )}
        {workout && !choosing && (
          <>
            <View style={{ gap: 12 }}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Txt muted size={12} weight="700" style={{ letterSpacing: 1 }}>{uiText("FORHÅNDSVISNING")}</Txt>
                {eligible.length > 1 && (
                  <Pressable
                    accessibilityRole="button"
                    disabled={busy}
                    onPress={() => setChoosing(true)}
                    style={{
                      minHeight: 44,
                      justifyContent: "center",
                      paddingLeft: 12,
                    }}
                  >
                    <Txt size={14} weight="600" style={{ color: c.accent }}>{uiText("Bytt økt")}</Txt>
                  </Pressable>
                )}
              </View>
              <WorkoutOverview workout={workout} />
              {canShare && workout.source !== "timer" && (
                <View style={{ borderRadius: 20, overflow: "hidden" }}>
                  {workout.sport === "Fotball" ? (
                    <FootballMap
                      key={workout.id + ":" + wholeRoute}
                      points={route}
                      height={220}
                    />
                  ) : (
                    <WorkoutMap points={route} height={220} />
                  )}
                </View>
              )}
            </View>
            <View style={{ gap: 12 }}>
              <Txt size={18} weight="700">{uiText("Hvem vil du dele med?")}</Txt>
              <AudienceOption
                title={profile?.is_private ? uiText("Godkjente følgere") : uiText("Følgere")}
                detail={uiText("De som følger deg i VYRO.")}
                selected={effectiveAudience === "followers"}
                disabled={busy || !profile}
                onPress={() => setAudience("followers")}
              />
              {!profile?.is_private && (
                <AudienceOption
                  title={uiText("Alle i VYRO")}
                  detail={uiText("Alle innloggede kan se innlegget.")}
                  selected={effectiveAudience === "everyone"}
                  disabled={busy || !profile}
                  onPress={() => setAudience("everyone")}
                />
              )}
              {!profile && (
                <Txt muted size={13}>
                  {failed
                    ? uiText("Kunne ikke hente delingsvalgene.")
                    : uiText("Henter delingsvalg …")}
                </Txt>
              )}
              {failed && !profile && (
                <Button
                  title={uiText("Prøv igjen")}
                  secondary
                  onPress={() => {
                    profileRequest.current?.abort();
                    profileRequest.current = new AbortController();
                    void loadOwnProfile(
                      userId,
                      profileRequest.current.signal,
                      true,
                    );
                  }}
                />
              )}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <Icon name="lock" size={15} color={c.muted} />
                <Txt size={12} muted style={{ flex: 1 }}>{uiText("Private notater og anstrengelse deles aldri.")}</Txt>
              </View>
            </View>
            {workout.sport === "Fotball" && workout.source === "gps" && (
              <View
                style={{
                  gap: 10,
                  borderTopWidth: 1,
                  borderColor: c.border,
                  paddingTop: 18,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <Txt weight="600" style={{ flex: 1 }}>{uiText("Del hele fotballruten")}</Txt>
                  <Switch
                    accessibilityLabel={uiText("Del hele fotballruten")}
                    value={wholeRoute}
                    disabled={busy}
                    onValueChange={(value) =>
                      setWholeRouteFor(value ? workout.id : null)
                    }
                  />
                </View>
                <Txt muted size={13}>{uiText("En bane kan ligge innenfor skjermingen på")}{" "}
                  {WORKOUT_SHARING_RADIUS_METERS}{" " + uiText("meter. Dette valget deler også start, slutt og eventuell vei til og fra banen.")}</Txt>
              </View>
            )}
            {workout.source === "gps" && (
              <View style={{ gap: 10 }}>
                <Txt muted size={13}>
                  {wholeRoute
                    ? uiText("Hele ruten i forhåndsvisningen blir delt. Start og slutt er synlige.")
                    : "Punkter innen " +
                      WORKOUT_SHARING_RADIUS_METERS +
                      " meter fra start og slutt skjules, også når du passerer dem senere. Tid og distanse gjelder hele økten."}
                </Txt>
                {!canShare && (
                  <Txt accessibilityRole="alert" size={14}>{uiText("Ingen delbar rute er igjen etter skjermingen. Økten på")}{" "}
                    {km(workout.distance)}{" " + uiText("km beholdes i treningsloggen.")}</Txt>
                )}
              </View>
            )}
            <Txt muted size={12}>{uiText("Har du delt denne økten før, oppdateres det eksisterende innlegget.")}</Txt>
          </>
        )}
      </View>
    </Page>
  );
}

function AudienceOption({
  title,
  detail,
  selected,
  disabled,
  onPress,
}: {
  title: string;
  detail: string;
  selected: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={title}
      accessibilityState={{ checked: selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        padding: 16,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: selected ? c.accent : c.border,
        backgroundColor: selected ? c.raised : c.surface,
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
      }}
    >
      <Icon
        name={title === "Alle i VYRO" ? "globe" : "people"}
        color={selected ? c.accent : c.muted}
        size={22}
      />
      <View style={{ flex: 1, gap: 4 }}>
        <Txt weight="700">{title}</Txt>
        <Txt size={13} muted>
          {detail}
        </Txt>
      </View>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: selected ? 0 : 1.5,
          borderColor: c.border,
          backgroundColor: selected ? c.accent : c.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && <Icon name="check" color={c.onAccent} size={16} />}
      </View>
    </Pressable>
  );
}
