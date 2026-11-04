import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { AccountGate } from "../../components/AccountGate";
import { Page } from "../../components/SettingsUi";
import { Avatar } from "../../components/SocialUi";
import { Button, Icon, Txt, useTheme } from "../../components/ui";
import { CloudPost } from "../../components/CloudPost";
import SafetyActions from "../../components/SafetyActions";
import { useAuthStore } from "../../stores/useAuthStore";
import { type Profile, socialError } from "../../features/social/api";
import { type FeedPost } from "../../features/social/feed";
import { changeFollow, type FollowState } from "../../features/social/profiles";
import { personName, visibleUsername } from "../../features/social/display";
import { loadPerson, loadPersonPosts } from "../../features/social/person";

export default function PersonRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const owner = useAuthStore((s) => s.session?.user.id);
  return (
    <AccountGate>
      {owner && <Person key={`${owner}:${id}`} owner={owner} id={id} />}
    </AccountGate>
  );
}
function Person({ owner, id }: { owner: string; id: string }) {
  const c = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [state, setState] = useState<FollowState>("none");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);
  const request = useRef<AbortController | null>(null);
  const lock = useRef(false);
  useFocusEffect(
    useCallback(() => {
      const abort = new AbortController();
      request.current = abort;
      lock.current = false;
      setBusy(false);
      setLoading(true);
      setError("");
      setProfile(null);
      setPosts([]);
      setMore(false);
      void (async () => {
        try {
          const person = await loadPerson(owner, id, abort.signal);
          if (abort.signal.aborted) return;
          if (!person) return;
          setProfile(person.profile);
          setState(person.state);
          if (
            !person.profile.is_private ||
            person.state === "following" ||
            id === owner
          ) {
            const result = await loadPersonPosts(id, abort.signal);
            if (!abort.signal.aborted) {
              setPosts(result.posts);
              setMore(result.more);
            }
          }
        } catch (e) {
          if (!abort.signal.aborted) setError(socialError(e));
        } finally {
          if (!abort.signal.aborted) setLoading(false);
        }
      })();
      return () => abort.abort();
      // Refresh deliberately starts a new abortable profile read.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [owner, id, revision]),
  );
  async function action(task: (signal: AbortSignal) => Promise<void>) {
    const signal = request.current?.signal;
    if (!signal || signal.aborted || lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    try {
      await task(signal);
    } catch (e) {
      if (!signal.aborted) setError(socialError(e));
    } finally {
      // An old action must not unlock a newer request after returning here.
      if (request.current?.signal === signal) {
        lock.current = false;
        setBusy(false);
      }
    }
  }
  const hidden = profile?.is_private && state !== "following" && id !== owner;
  return (
    <Page title="Profil" fallback="/people" plain>
      <View style={{ padding: 20, gap: 24 }}>
        {loading && (
          <ActivityIndicator
            accessibilityLabel="Henter profil"
            color={c.accent}
          />
        )}
        {!!error && (
          <View style={{ gap: 12 }}>
            <Txt accessibilityRole="alert">{error}</Txt>
            <Button
              title="Prøv igjen"
              secondary
              onPress={() => setRevision((n) => n + 1)}
            />
          </View>
        )}
        {!loading && !error && !profile && (
          <Txt muted>Profilen er ikke tilgjengelig.</Txt>
        )}
        {profile && (
          <>
            <View style={{ alignItems: "center", gap: 12 }}>
              <Avatar
                name={personName(profile.display_name)}
                path={profile.avatar_path}
                size={88}
              />
              <Txt size={28} weight="800" style={{ textAlign: "center" }}>
                {personName(profile.display_name)}
              </Txt>
              {visibleUsername(profile.username) && (
                <Txt muted>{visibleUsername(profile.username)}</Txt>
              )}
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Icon
                  name={profile.is_private ? "lock" : "globe"}
                  size={16}
                  color={c.muted}
                />
                <Txt muted size={13}>
                  {profile.is_private ? "Privat konto" : "Offentlig konto"}
                </Txt>
              </View>
            </View>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <View style={{ flex: 1 }}>
                <Button
                  title={
                    busy
                      ? "Lagrer …"
                      : state === "following"
                        ? "Slutt å følge"
                        : state === "requested"
                          ? "Avbryt forespørsel"
                          : profile.is_private
                            ? "Be om å følge"
                            : "Følg"
                  }
                  secondary={state !== "none"}
                  disabled={busy || loading || id === owner}
                  onPress={() =>
                    void action(async (signal) => {
                      await changeFollow(owner, id, state === "none");
                      if (!signal.aborted) setRevision((n) => n + 1);
                    })
                  }
                />
              </View>
              <SafetyActions
                owner={owner}
                target={id}
                name={personName(profile.display_name)}
                onBlocked={() =>
                  router.canGoBack() ? router.back() : router.replace("/people")
                }
              />
            </View>
            {hidden ? (
              <View
                style={{
                  backgroundColor: c.raised,
                  borderRadius: 20,
                  padding: 22,
                  gap: 8,
                }}
              >
                <Txt weight="700">Denne profilen er privat</Txt>
                <Txt muted>
                  Delte innlegg blir synlige når følgeforespørselen din er
                  godkjent.
                </Txt>
              </View>
            ) : (
              <>
                <Txt size={21} weight="700">
                  Delte økter
                </Txt>
                {!loading && !error && !posts.length && (
                  <Txt muted>Ingen delte økter å vise ennå.</Txt>
                )}
                {posts.map((post) => (
                  <CloudPost
                    key={post.id}
                    post={post}
                    userId={owner}
                    onRemoved={() => setRevision((n) => n + 1)}
                    onReactionsChanged={(postId, summary) =>
                      setPosts((rows) =>
                        rows.map((row) =>
                          row.id === postId ? { ...row, ...summary } : row,
                        ),
                      )
                    }
                  />
                ))}
                {more && (
                  <Button
                    secondary
                    title={busy ? "Henter …" : "Vis flere økter"}
                    disabled={busy || loading}
                    onPress={() =>
                      void action(async (signal) => {
                        const result = await loadPersonPosts(
                          id,
                          signal,
                          posts.length,
                        );
                        if (!signal.aborted) {
                          setPosts((old) => [
                            ...old,
                            ...result.posts.filter(
                              (row) => !old.some((p) => p.id === row.id),
                            ),
                          ]);
                          setMore(result.more);
                        }
                      })
                    }
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
