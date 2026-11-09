import { message as uiText } from "../../i18n/language";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { Page, SettingsRow } from "../../components/SettingsUi";
import { Button, Txt } from "../../components/ui";
import { useRouteLibrary } from "../../stores/useRouteLibrary";
import { useSavedRoutes } from "../../stores/useSavedRoutes";
import { useVisibleWorkouts } from "../activities/useVisibleWorkouts";
import { km } from "../activities/model";
import { loadSavedRoutes, type SavedCursor } from "./api";
import { routeMessage, type RouteSummary } from "./model";
export function RouteLibrary({ userId }: { userId: string }) {
  const cached = useRouteLibrary((s) => s.entries);
  const ids = useSavedRoutes((s) => s.ids);
  const own = useVisibleWorkouts().filter(
    (w) => w.source === "gps" && w.ownerId === userId && ids.includes(w.id),
  );
  const [routes, setRoutes] = useState<RouteSummary[]>(() =>
    cached.filter((e) => e.ownerId === userId).map((e) => e.route),
  );
  const [next, setNext] = useState<SavedCursor | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [reload, setReload] = useState(0);
  const request = useRef<AbortController | null>(null),
    paging = useRef(false);
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      request.current = controller;
      paging.current = false;
      setLoading(true);
      setError("");
      void loadSavedRoutes(userId, null, controller.signal)
        .then((page) => {
          if (!controller.signal.aborted) {
            setRoutes(page.routes);
            setNext(page.next);
          }
        })
        .catch((e) => {
          if (!controller.signal.aborted) setError(routeMessage(e));
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
      return () => controller.abort();
      // Explicit refresh also reconciles changes made on another device.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, reload]),
  );
  async function more() {
    const controller = request.current;
    if (
      !next ||
      loading ||
      paging.current ||
      !controller ||
      controller.signal.aborted
    )
      return;
    paging.current = true;
    setLoading(true);
    setError("");
    try {
      const page = await loadSavedRoutes(userId, next, controller.signal);
      if (!controller.signal.aborted) {
        setRoutes((old) => [
          ...new Map([...old, ...page.routes].map((r) => [r.id, r])).values(),
        ]);
        setNext(page.next);
      }
    } catch (e) {
      if (!controller.signal.aborted) setError(routeMessage(e));
    } finally {
      if (!controller.signal.aborted) {
        paging.current = false;
        setLoading(false);
      }
    }
  }
  return (
    <Page title={uiText("Lagrede løyper")} fallback="/routes" scroll={false}>
      <FlatList
        data={
          routes.length || (!loading && !error)
            ? routes
            : cached.filter((e) => e.ownerId === userId).map((e) => e.route)
        }
        keyExtractor={(r) => r.id}
        contentContainerStyle={{
          paddingBottom: 30,
          width: "100%",
          maxWidth: 680,
          alignSelf: "center",
        }}
        ListHeaderComponent={
          <View style={{ padding: 20, gap: 14 }}>
            <Txt muted>{uiText("Løyper du har lagret på kontoen din.")}</Txt>
            <Button
              title={uiText("Finn nye løyper")}
              onPress={() => router.push("/routes")}
            />
            {!!error && (
              <>
                <Txt accessibilityRole="alert">
                  {error}
                  {routes.length ? uiText(" Listen kan være utdatert.") : ""}
                </Txt>
                <Button
                  title={uiText("Oppdater Lagret")}
                  secondary
                  disabled={loading}
                  onPress={() => setReload((n) => n + 1)}
                />
              </>
            )}
            {loading && (
              <ActivityIndicator accessibilityLabel={uiText("Henter lagrede løyper")} />
            )}
          </View>
        }
        renderItem={({ item: r }) => (
          <SettingsRow
            title={r.name}
            description={`${r.sport} · ${km(r.distance_m / 1000)} km`}
            icon="map"
            label={uiText("Åpne {0}", r.name)}
            onPress={() =>
              router.push({ pathname: "/routes", params: { id: r.id } })
            }
          />
        )}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={{ padding: 20 }}>
              <Txt>{uiText("Ingen ruteforslag lagret ennå. Velg en løype og trykk «Lagre løypa».")}</Txt>
            </View>
          ) : undefined
        }
        ListFooterComponent={
          <View style={{ gap: 12, padding: 20 }}>
            {next && (
              <Button
                title={uiText("Vis flere lagrede løyper")}
                secondary
                disabled={loading}
                onPress={more}
              />
            )}
            {!!own.length && (
              <>
                <Txt weight="700">{uiText("Dine bokmerkede GPS-turer")}</Txt>
                <Txt muted size={13}>{uiText("Private turer som ligger på denne enheten.")}</Txt>
                {own.map((w) => (
                  <SettingsRow
                    key={w.id}
                    title={w.title}
                    description={`${km(w.distance)} km`}
                    icon="run"
                    onPress={() =>
                      router.push({
                        pathname: "/activity/[id]",
                        params: { id: w.id },
                      })
                    }
                  />
                ))}
              </>
            )}
          </View>
        }
      />
    </Page>
  );
}
