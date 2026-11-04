import { client, profileColumns, type Profile } from "./api";
import { type FeedPost } from "./feed";
import type { FollowState } from "./profiles";

/** Uses the signed-in client's existing RLS; never reads private workout backups. */
export async function loadPerson(
  owner: string,
  id: string,
  signal: AbortSignal,
) {
  const profile = await client()
    .from("profiles")
    .select(profileColumns)
    .eq("id", id)
    .abortSignal(signal)
    .maybeSingle();
  if (profile.error) throw profile.error;
  if (!profile.data) return null;
  const [follow, request] = await Promise.all([
    client()
      .from("follows")
      .select("following_id")
      .eq("follower_id", owner)
      .eq("following_id", id)
      .abortSignal(signal),
    client()
      .from("follow_requests")
      .select("recipient_id")
      .eq("requester_id", owner)
      .eq("recipient_id", id)
      .abortSignal(signal),
  ]);
  if (follow.error || request.error) throw follow.error || request.error;
  const state: FollowState = follow.data?.length
    ? "following"
    : request.data?.length
      ? "requested"
      : "none";
  return { profile: profile.data as Profile, state };
}
export async function loadPersonPosts(
  id: string,
  signal: AbortSignal,
  offset = 0,
) {
  const result = await client()
    .from("posts")
    .select(
      `id,author_id,title,sport,distance_km,seconds,recorded_at,created_at,audience,profiles!posts_author_id_fkey(${profileColumns})`,
    )
    .eq("author_id", id)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + 20)
    .abortSignal(signal);
  if (result.error) throw result.error;
  const rows = (result.data ?? []) as unknown as FeedPost[];
  return { posts: rows.slice(0, 20), more: rows.length > 20 };
}
