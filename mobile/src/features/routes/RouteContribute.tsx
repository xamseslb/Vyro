import { message as uiText, displayLocale } from "../../i18n/language";
import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Switch, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Page, SettingsRow } from "../../components/SettingsUi";
import { Button, Txt, useTheme } from "../../components/ui";
import WorkoutMap from "../../components/WorkoutMap";
import { useAppStore } from "../../stores/useAppStore";
import { km } from "../activities/model";
import { canContribute, contributionPreview } from "./contribution";
import { contributeRoute, ownContributions } from "./api";
import { routeMessage, type RouteSummary } from "./model";

export function RouteContribute({ userId }: { userId: string }) {
  const c = useTheme();
  const workouts = useAppStore((s) => s.workouts);
  const eligible = useMemo(
    () => workouts.filter((w) => canContribute(w, userId)),
    [workouts, userId],
  );
  const [selected, select] = useState<string>();
  const workout = eligible.find((w) => w.id === selected);
  const preview = useMemo(
    () => (workout ? contributionPreview(workout, userId) : null),
    [workout, userId],
  );
  const [name, setName] = useState("");
  const [place, setPlace] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [listError, setListError] = useState("");
  const [own, setOwn] = useState<RouteSummary[]>([]);
  const [reload, setReload] = useState(0);
  const request = useRef<AbortController | null>(null),
    lock = useRef(false);
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      request.current = controller;
      lock.current = false;
      setBusy(false);
      setLoading(true);
      setListError("");
      void ownContributions(userId, controller.signal)
        .then((rows) => {
          if (!controller.signal.aborted) setOwn(rows);
        })
        .catch((e) => {
          if (!controller.signal.aborted) setListError(routeMessage(e));
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      return () => controller.abort();
      // Explicit retry refetches the contribution list.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, reload]),
  );
  async function share() {
    const controller = request.current;
    if (
      !workout ||
      !preview ||
      !consent ||
      !name.trim() ||
      !place.trim() ||
      lock.current ||
      !controller ||
      controller.signal.aborted
    )
      return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      const id = await contributeRoute(
        userId,
        workout,
        name,
        place,
        consent,
        controller.signal,
      );
      if (!controller.signal.aborted)
        router.replace({ pathname: "/routes", params: { id } });
    } catch (e) {
      if (!controller.signal.aborted) setError(routeMessage(e));
    } finally {
      if (!controller.signal.aborted) {
        lock.current = false;
        setBusy(false);
      }
    }
  }
  const input = {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 14,
    padding: 14,
    color: c.text,
    backgroundColor: c.surface,
    fontSize: 16,
  };
  return (
    <Page
      title={workout ? uiText("Forhåndsvis løypa") : uiText("Bidra med en løype")}
      fallback="/routes"
      backDisabled={busy}
      onBack={
        workout
          ? () => {
              select(undefined);
              setConsent(false);
              setError("");
            }
          : undefined
      }
      footer={
        workout ? (
          <>
            {!!error && <Txt accessibilityRole="alert">{error}</Txt>}
            <Button
              title={busy ? uiText("Deler …") : uiText("Del løypa med alle")}
              disabled={
                busy || !preview || !consent || !name.trim() || !place.trim()
              }
              onPress={share}
            />
          </>
        ) : undefined
      }
    >
      <View style={{ padding: 20, gap: 18 }}>
        {!workout ? (
          <>
            <Txt size={26} weight="700">{uiText("Din tur kan bli noens neste løype")}</Txt>
            <Txt muted>{uiText("Velg en av dine gjennomførte turer. Du ser hva du deler før løypa blir tilgjengelig for andre.")}</Txt>
            <Txt weight="700">{uiText("Velg en GPS-tur")}</Txt>
            {!eligible.length && (
              <>
                <Txt>{uiText("Du har ingen GPS-turer å dele ennå. Ta opp en løpetur eller gåtur først.")}</Txt>
                <Button
                  title={uiText("Start en tur")}
                  onPress={() => router.push("/(tabs)/track")}
                />
              </>
            )}
            {eligible.map((w) => (
              <SettingsRow
                key={w.id}
                title={w.title}
                description={`${km(w.distance)} km · ${new Date(w.date).toLocaleDateString(displayLocale())}`}
                icon="map"
                label={uiText("Velg tur: {0}", w.title)}
                onPress={() => {
                  select(w.id);
                  setName("");
                  setPlace("");
                  setConsent(false);
                  setError("");
                }}
              />
            ))}
            <Txt size={22} weight="700">{uiText("Løyper du har delt")}</Txt>
            {loading && (
              <ActivityIndicator accessibilityLabel={uiText("Henter dine bidrag")} />
            )}
            {!!listError && (
              <>
                <Txt accessibilityRole="alert">{listError}</Txt>
                <Button
                  title={uiText("Hent bidrag på nytt")}
                  secondary
                  onPress={() => setReload((n) => n + 1)}
                />
              </>
            )}
            {!loading && !listError && !own.length && (
              <Txt muted>{uiText("Ingen delte løyper ennå.")}</Txt>
            )}
            {own.map((r) => (
              <SettingsRow
                key={r.id}
                title={r.name}
                description={`${r.place} · ${km(r.distance_m / 1000)} km`}
                icon="map"
                onPress={() =>
                  router.push({ pathname: "/routes", params: { id: r.id } })
                }
              />
            ))}
          </>
        ) : preview ? (
          <>
            <WorkoutMap points={preview.route} height={280} />
            <Txt size={24} weight="700">
              {km(preview.distance / 1000)}{" " + uiText("km synlig løype")}</Txt>
            <Txt muted>{uiText("Området innen 500 meter fra start og slutt er skjult. Bare linjen på kartet deles; tid, tempo og notater forblir private.")}</Txt>
            <Txt weight="700">{uiText("Navn på løypa")}</Txt>
            <TextInput
              accessibilityLabel={uiText("Navn på delt løype")}
              placeholder={uiText("Gi løypa et navn")}
              placeholderTextColor={c.muted}
              value={name}
              onChangeText={setName}
              editable={!busy}
              maxLength={120}
              style={input}
            />
            <Txt weight="700">{uiText("Sted eller by")}</Txt>
            <TextInput
              accessibilityLabel={uiText("Sted eller by")}
              placeholder={uiText("Hvor går løypa?")}
              placeholderTextColor={c.muted}
              value={place}
              onChangeText={setPlace}
              editable={!busy}
              maxLength={100}
              style={input}
            />
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <Switch
                accessibilityLabel={uiText("Jeg vil dele denne løypa med alle i VYRO")}
                value={consent}
                onValueChange={setConsent}
                disabled={busy}
              />
              <Txt style={{ flex: 1 }}>{uiText("Jeg vil dele denne løypa med alle i VYRO.")}</Txt>
            </View>
            <Txt muted size={13}>{uiText("Du kan trekke delingen tilbake fra «Løyper du har delt». En lik løype som allerede finnes, blir avvist.")}</Txt>
          </>
        ) : (
          <Txt>{uiText("Denne turen har for lite sammenhengende løype etter skjerming, eller er over 50 km. Velg en annen tur.")}</Txt>
        )}
      </View>
    </Page>
  );
}
