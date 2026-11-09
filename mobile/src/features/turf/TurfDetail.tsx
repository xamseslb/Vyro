import { message as uiText } from "../../i18n/language";
import { ProfileLink } from "../../components/ProfileLink";
import { personName } from "../social/display";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Page } from "../../components/SettingsUi";
import { Button, Txt } from "../../components/ui";
import WorkoutMap from "../../components/WorkoutMap";
import { useAppStore } from "../../stores/useAppStore";
import { duration, km } from "../activities/model";
import { loadTurf, turfError, withdrawTurf } from "./api";
import type { GrowingTurf } from "./growth";

export function useTurf(id?: string) {
  const [turf, setTurf] = useState<GrowingTurf | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(!!id);
  const [reload, setReload] = useState(0);
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      if (!id) return () => controller.abort();
      setLoading(true);
      setError("");
      void loadTurf(id, controller.signal)
        .then((data) => {
          if (!controller.signal.aborted) setTurf(data);
        })
        .catch((e) => {
          if (!controller.signal.aborted) setError(turfError(e));
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      return () => controller.abort();
      // Manual refresh deliberately restarts the focus subscription.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, reload]),
  );
  return { turf, error, loading, retry: () => setReload((n) => n + 1) };
}
export function TurfDetail({ userId, id }: { userId: string; id: string }) {
  const { turf, error: loadError, loading, retry } = useTurf(id);
  const [error, setError] = useState("");
  const [withdraw, setWithdraw] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const alive = useRef(true);
  useFocusEffect(
    useCallback(() => {
      alive.current = true;
      return () => {
        alive.current = false;
      };
    }, []),
  );
  const owner = turf?.owner_id === userId;
  return (
    <Page title={uiText("Sone")} fallback="/turf" backDisabled={busy}>
      <View style={{ padding: 20, gap: 18 }}>
        {loading && <ActivityIndicator accessibilityLabel={uiText("Henter sonen")} />}
        {!!loadError && (
          <>
            <Txt accessibilityRole="alert">{loadError}</Txt>
            <Button title={uiText("Prøv igjen")} secondary onPress={retry} />
          </>
        )}
        {turf && (
          <>
            <Txt size={28} weight="700">
              {turf.name}
            </Txt>
            <ProfileLink id={turf.owner_id} name={turf.profiles?.display_name}><Txt muted>
              {owner
                ? uiText("Du eier denne sonen")
                : uiText("{0} eier sonen", personName(turf.profiles?.display_name))}{" "}
              ·{" "}
              {turf.club_id ? uiText("Klubbens sone") : uiText("Privat arkiv · tidligere sone")}
            </Txt></ProfileLink>
            <WorkoutMap points={turf.route} height={230} />
            <Txt size={22} weight="700">
              {km(turf.distance_m / 1000)} km · {duration(turf.seconds)}{" " + uiText("å slå")}</Txt>
            <Txt muted size={14}>{uiText("Løp hele løypa i samme retning. Raskere totaltid, inkludert pauser, overtar sonen.")}</Txt>
            {!!error && <Txt accessibilityRole="alert">{error}</Txt>}
            <Button
              title={uiText("Løp denne løypa")}
              disabled={busy || loading || !!loadError}
              onPress={() => {
                if (
                  !useAppStore.getState().selectTurf({
                    id: turf.id,
                    name: turf.name,
                    route: turf.route,
                  })
                ) {
                  setError(uiText("Avslutt økten som pågår før du velger en ny sone."));
                  return;
                }
                router.push("/(tabs)/track");
              }}
            />
            {!owner && !!turf.club_id && (
              <Button
                title={uiText("Bruk en lagret løpetur")}
                secondary
                disabled={loading || !!loadError}
                onPress={() =>
                  router.push({
                    pathname: "/turf",
                    params: { turfId: id, mode: "attempt" },
                  })
                }
              />
            )}
            <Button
              title={uiText("Til klubbens soner")}
              secondary
              disabled={busy}
              onPress={() =>
                router.replace({
                  pathname: "/(tabs)/map",
                  params: { view: "zones", clubId: turf.club_id ?? undefined },
                })
              }
            />
            {owner && (
              <>
                {withdraw && (
                  <Txt>{uiText("Dette fjerner sonen og sonehistorikken for alle. Den private løpeturen din beholdes.")}</Txt>
                )}
                <Button
                  title={
                    busy
                      ? uiText("Fjerner …")
                      : withdraw
                        ? uiText("Bekreft: fjern sonen")
                        : uiText("Trekk tilbake sonen")
                  }
                  secondary={!withdraw}
                  danger={withdraw}
                  disabled={busy || loading || !!loadError}
                  onPress={async () => {
                    if (!withdraw) {
                      setWithdraw(true);
                      return;
                    }
                    if (lock.current) return;
                    lock.current = true;
                    setBusy(true);
                    setError("");
                    try {
                      await withdrawTurf(id, userId);
                      if (alive.current) router.replace("/turf");
                    } catch (e) {
                      if (alive.current) setError(turfError(e));
                    } finally {
                      lock.current = false;
                      if (alive.current) setBusy(false);
                    }
                  }}
                />
                {withdraw && (
                  <Button
                    title={uiText("Behold sonen")}
                    secondary
                    disabled={busy}
                    onPress={() => setWithdraw(false)}
                  />
                )}
              </>
            )}
          </>
        )}
      </View>
    </Page>
  );
}
