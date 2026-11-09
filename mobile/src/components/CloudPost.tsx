import { message as uiText, displayLocale } from "../i18n/language";
import { useEffect, useState } from "react";
import { View, useWindowDimensions } from "react-native";
import { client, Post, socialError } from "../features/social/api";
import { FeedPost, ReactionSummary } from "../features/social/feed";
import { km, duration, pace } from "../features/activities/model";
import { isSport, sportInfo } from "../features/activities/sports";
import { Button, Txt, useTheme } from "./ui";
import WorkoutMap from "./WorkoutMap";
import FootballMap, { FootballSpeed } from "./FootballMap";
import { Avatar } from "./SocialUi";
import { ProfileLink } from "./ProfileLink";

import PostComments from "./PostComments";
import { personName, visibleUsername } from "../features/social/display";
import SafetyActions from "./SafetyActions";
import { PostActions } from "./PostActions";

export function CloudPost({
  post,
  userId,
  onRemoved,
  onReactionsChanged,
  initialComments = false,
}: {
  post: FeedPost;
  userId: string;
  onRemoved: () => void;
  onReactionsChanged?: (id: string, summary: ReactionSummary) => void;
  initialComments?: boolean;
}) {
  const c = useTheme();
  const { fontScale, width } = useWindowDimensions();
  const [expanded, setExpanded] = useState(initialComments);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [confirm, setConfirm] = useState(false);
  async function action(task: () => Promise<void>) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await task();
    } catch (e) {
      setError(socialError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <View
      style={{
        gap: 16,
        borderBottomWidth: 1,
        borderColor: c.border,
        paddingBottom: 24,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <ProfileLink id={post.author_id} name={post.profiles.display_name} style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <Avatar
          name={personName(post.profiles.display_name)}
          path={post.profiles.avatar_path}
        />
        <View style={{ flex: 1, gap: 3 }}>
          <Txt weight="700">{personName(post.profiles.display_name)}</Txt>
          <Txt muted size={12}>
            {visibleUsername(post.profiles.username)
              ? `${visibleUsername(post.profiles.username)} · `
              : ""}
            {new Date(post.recorded_at).toLocaleDateString(displayLocale())}
          </Txt>
        </View>
        </ProfileLink>
        <SafetyActions
          owner={userId}
          target={post.author_id}
          name={post.profiles.display_name}
          postId={post.id}
          onBlocked={onRemoved}
        />
      </View>
      <Txt size={24} weight="700">
        {post.title}
      </Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
        {(Number(post.distance_km) === 0
          ? [["Tid", duration(post.seconds)]]
          : [
              ["Distanse", `${km(Number(post.distance_km))} km`],
              ["Tid", duration(post.seconds)],
              isSport(post.sport) && sportInfo(post.sport).metric === "speed"
                ? [
                    "Snittfart",
                    `${post.seconds > 0 ? ((Number(post.distance_km) * 3600) / post.seconds).toFixed(1).replace(".", ",") : "—"} km/t`,
                  ]
                : ["Tempo", `${pace(Number(post.distance_km), post.seconds)}`],
            ]
        ).map(([label, value]) => (
          <View
            key={label}
            style={{
              gap: 5,
              flexGrow: 1,
              flexBasis: Math.min(width - 48, 100 * Math.max(1, fontScale)),
            }}
          >
            <Txt muted size={12}>
              {uiText(label)}
            </Txt>
            <Txt
              weight="700"
              size={21}
              numberOfLines={1}
              style={{ fontVariant: ["tabular-nums"] }}
            >
              {value}
            </Txt>
            {label === "Tempo" && (
              <Txt size={11} muted>
                min/km
              </Txt>
            )}
          </View>
        ))}
      </View>
      {Number(post.distance_km) > 0 && (
        <PostMap
          key={`${post.id}:${userId}`}
          postId={post.id}
          football={post.sport === "Fotball"}
        />
      )}
      <Txt muted size={12}>
        {uiText(post.sport)} ·{" "}
        {post.audience === "followers"
          ? uiText("Delt med følgere")
          : uiText("Delt med innloggede VYRO-brukere")}
      </Txt>
      <Reactions
        key={`${post.id}:${post.like_count}:${post.liked}:${post.reposted}`}
        postId={post.id}
        userId={userId}
        onChange={onReactionsChanged}
        onComment={() => setExpanded(true)}
        commentsOpen={expanded}
        summary={
          post.like_count == null
            ? undefined
            : {
                like_count: Number(post.like_count),
                liked: !!post.liked,
                reposted: !!post.reposted,
              }
        }
      />
      {expanded && (
        <PostComments
          key={`${post.id}:${userId}`}
          postId={post.id}
          userId={userId}
          draft={text}
          onDraftChange={setText}
          onClose={() => setExpanded(false)}
        />
      )}
      {post.author_id === userId && (
        <Button
          title={
            confirm
              ? uiText("Bekreft: trekk tilbake innlegget")
              : uiText("Trekk tilbake deling")
          }
          secondary
          disabled={busy}
          onPress={() => {
            if (!confirm) {
              setConfirm(true);
              return;
            }
            void action(async () => {
              const r = await client()
                .from("posts")
                .delete()
                .eq("id", post.id)
                .eq("author_id", userId);
              if (r.error) throw r.error;
              onRemoved();
            });
          }}
        />
      )}
      {confirm && post.author_id === userId && (
        <Button
          title={uiText("Avbryt")}
          secondary
          disabled={busy}
          onPress={() => setConfirm(false)}
        />
      )}
      {!!error && <Txt>{error}</Txt>}
    </View>
  );
}

function PostMap({ postId, football }: { postId: string; football: boolean }) {
  const [revision, setRevision] = useState(0);
  const [route, setRoute] = useState<Post["route"] | null>(null);
  const [error, setError] = useState("");
  const [maxSpeed, setMaxSpeed] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setError(uiText("Kartet brukte for lang tid på å laste. Prøv igjen."));
      controller.abort();
    }, 15000);
    void (async () => {
      try {
        const result = await client()
          .from("posts")
          .select("route,max_speed_kmh")
          .eq("id", postId)
          .abortSignal(controller.signal)
          .single();
        if (result.error) throw result.error;
        if (!controller.signal.aborted) {
          setRoute(result.data.route as Post["route"]);
          setMaxSpeed(
            result.data.max_speed_kmh == null
              ? null
              : Number(result.data.max_speed_kmh),
          );
        }
      } catch (e) {
        if (!controller.signal.aborted) setError(socialError(e));
      } finally {
        clearTimeout(timeout);
      }
    })();
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [postId, revision]);
  return (
    <View style={{ minHeight: 220, justifyContent: "center" }}>
      {error ? (
        <View style={{ gap: 12 }}>
          <Txt>{error}</Txt>
          <Button
            title={uiText("Last kartet på nytt")}
            secondary
            onPress={() => {
              setRoute(null);
              setError("");
              setRevision((n) => n + 1);
            }}
          />
        </View>
      ) : route ? (
        route.length < 2 ? (
          <Txt muted>{uiText("Dette innlegget har ikke et delt rutekart.")}</Txt>
        ) : football ? (
          <View style={{ gap: 16 }}>
            <FootballMap points={route} height={260} />
            <FootballSpeed value={maxSpeed} />
          </View>
        ) : (
          <WorkoutMap points={route} height={220} />
        )
      ) : (
        <Txt muted>{uiText("Laster kart …")}</Txt>
      )}
    </View>
  );
}

function Reactions({
  postId,
  userId,
  summary,
  onChange,
  onComment,
  commentsOpen,
}: {
  postId: string;
  userId: string;
  summary?: ReactionSummary;
  onChange?: (id: string, summary: ReactionSummary) => void;
  onComment: () => void;
  commentsOpen: boolean;
}) {
  const [liked, setLiked] = useState(summary?.liked ?? false);
  const [reposted, setReposted] = useState(summary?.reposted ?? false);
  const [count, setCount] = useState(summary?.like_count ?? 0);
  const [ready, setReady] = useState(summary != null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const {
    like_count,
    liked: initialLiked,
    reposted: initialReposted,
  } = summary ?? {};
  useEffect(() => {
    if (like_count != null) return;
    const controller = new AbortController();
    let live = true;
    Promise.all([
      client()
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId)
        .abortSignal(controller.signal),
      client()
        .from("likes")
        .select("user_id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .abortSignal(controller.signal),
      client()
        .from("reposts")
        .select("user_id")
        .eq("post_id", postId)
        .eq("user_id", userId)
        .abortSignal(controller.signal),
    ])
      .then(([total, like, repost]) => {
        if (!live) return;
        const problem = total.error || like.error || repost.error;
        if (problem) {
          setError(socialError(problem));
          return;
        }
        setCount(total.count ?? 0);
        setLiked(!!like.data?.length);
        setReposted(!!repost.data?.length);
        setReady(true);
      })
      .catch((e) => {
        if (live) setError(socialError(e));
      });
    return () => {
      live = false;
      controller.abort();
    };
  }, [postId, userId, like_count, initialLiked, initialReposted]);
  async function toggle(table: "likes" | "reposts", present: boolean) {
    if (busy || !ready) return;
    setBusy(true);
    setError("");
    try {
      const r = present
        ? await client()
            .from(table)
            .delete()
            .eq("post_id", postId)
            .eq("user_id", userId)
        : await client()
            .from(table)
            .upsert(
              { post_id: postId, user_id: userId },
              { onConflict: "user_id,post_id", ignoreDuplicates: true },
            );
      if (r.error) throw r.error;
      const updated = {
        like_count:
          table === "likes" ? Math.max(0, count + (present ? -1 : 1)) : count,
        liked: table === "likes" ? !present : liked,
        reposted: table === "reposts" ? !present : reposted,
      };
      if (table === "likes") {
        setLiked(!present);
        setCount((n) => Math.max(0, n + (present ? -1 : 1)));
      } else setReposted(!present);
      onChange?.(postId, updated);
    } catch (e) {
      setError(socialError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PostActions
        liked={liked}
        likeCount={count}
        reposted={reposted}
        disabled={busy || !ready}
        commentsOpen={commentsOpen}
        onLike={() => void toggle("likes", liked)}
        onComment={onComment}
        onRepost={() => void toggle("reposts", reposted)}
      />
      {reposted && (
        <Txt muted size={12}>{uiText("Repost lagret. Originalinnlegget beholdes.")}</Txt>
      )}
      {!!error && <Txt>{error}</Txt>}
    </>
  );
}
