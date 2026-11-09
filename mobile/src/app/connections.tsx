import { message as uiText } from "../i18n/language";
import { useCallback, useRef, useState } from "react";
import { View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { Page, SettingsGroup, SettingsRow } from "../components/SettingsUi";
import { AccountGate } from "../components/AccountGate";
import { Button, Txt } from "../components/ui";
import { useAuthStore } from "../stores/useAuthStore";
import {
  loadConnections,
  type ConnectionKind,
} from "../features/social/connections";
import { client, socialError, type Profile } from "../features/social/api";
import { openProfile } from "../components/ProfileLink";
import { personName, visibleUsername } from "../features/social/display";
import { Avatar } from "../components/SocialUi";
export default function Connections() {
  const id = useAuthStore((s) => s.session?.user.id);
  const params = useLocalSearchParams<{ tab?: string }>();
  const kind = params.tab === "following" ? "following" : "followers";
  return (
    <AccountGate>
      {id && <ConnectionList key={`${id}:${kind}`} owner={id} kind={kind} />}
    </AccountGate>
  );
}
function ConnectionList({
  owner,
  kind,
}: {
  owner: string;
  kind: ConnectionKind;
}) {
  const [people, setPeople] = useState<Profile[]>([]);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  const offset = useRef(0);
  const load = useCallback(
    async (append = false) => {
      request.current?.abort();
      const control = new AbortController();
      request.current = control;
      setBusy(true);
      setError("");
      try {
        const result = await loadConnections(
          owner,
          kind,
          append ? offset.current : 0,
          control.signal,
        );
        if (control.signal.aborted) return;
        setPeople((previous) =>
          append
            ? [
                ...previous,
                ...result.people.filter(
                  (p) => !previous.some((old) => old.id === p.id),
                ),
              ]
            : result.people,
        );
        offset.current = (append ? offset.current : 0) + result.people.length;
        setMore(result.more);
      } catch (e) {
        if (!control.signal.aborted) setError(socialError(e));
      } finally {
        if (!control.signal.aborted) setBusy(false);
      }
    },
    [owner, kind],
  );
  useFocusEffect(
    useCallback(() => {
      void load();
      return () => request.current?.abort();
    }, [load]),
  );
  return (
    <Page
      title={kind === "followers" ? uiText("Følgere") : uiText("Følger")}
      fallback="/profile"
    >
      <SettingsGroup>
        {people.map((p) => (
          <View key={p.id}>
            <SettingsRow
              title={personName(p.display_name)}
              description={visibleUsername(p.username) ?? undefined}
              end={<Avatar name={p.display_name} path={p.avatar_path} />}
              onPress={() =>
                openProfile(p.id)
              }
            />
            {kind === "followers" && (
              <View style={{ paddingHorizontal: 22, paddingBottom: 12 }}>
                <Button
                  secondary
                  title={uiText("Fjern følger")}
                  disabled={busy}
                  onPress={async () => {
                    setBusy(true);
                    setError("");
                    try {
                      const result = await client()
                        .from("follows")
                        .delete()
                        .eq("following_id", owner)
                        .eq("follower_id", p.id);
                      if (result.error) throw result.error;
                      await load();
                    } catch (e) {
                      setError(socialError(e));
                    } finally {
                      setBusy(false);
                    }
                  }}
                />
              </View>
            )}
          </View>
        ))}
      </SettingsGroup>
      <View style={{ padding: 22, gap: 14 }}>
        {busy && <Txt muted>{uiText("Henter personer …")}</Txt>}
        {!!error && (
          <>
            <Txt>{error}</Txt>
            <Button title={uiText("Prøv igjen")} onPress={() => void load()} />
          </>
        )}
        {!busy && !error && !people.length && (
          <Txt muted>
            {kind === "followers"
              ? uiText("Du har ingen følgere ennå.")
              : uiText("Du følger ingen ennå. Finn noen å dele turene med.")}
          </Txt>
        )}
        {more && (
          <Button
            title={uiText("Vis flere")}
            disabled={busy}
            secondary
            onPress={() => void load(true)}
          />
        )}
        <Button
          title={uiText("Finn venner")}
          secondary
          onPress={() => router.push("/people")}
        />
      </View>
    </Page>
  );
}
