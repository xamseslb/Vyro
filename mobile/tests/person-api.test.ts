import { client } from "../src/features/social/api";
import { loadPerson, loadPersonPosts } from "../src/features/social/person";
jest.mock("../src/features/social/api", () => ({
  client: jest.fn(),
  profileColumns: "id,username,display_name,is_private,avatar_path",
}));
const profile = {
  id: "friend",
  username: "mina",
  display_name: "Mina",
  is_private: true,
};
function setup(follows: unknown[] = [], requests: unknown[] = []) {
  const queries: Record<string, Record<string, jest.Mock>> = {};
  for (const [table, data] of Object.entries({
    profiles: profile,
    follows,
    follow_requests: requests,
    posts: [],
  })) {
    const q: Record<string, jest.Mock> = {};
    for (const method of ["select", "eq", "order", "range"])
      q[method] = jest.fn(() => q);
    q.abortSignal = jest.fn(() =>
      table === "profiles" ? q : Promise.resolve({ data, error: null }),
    );
    q.maybeSingle = jest.fn(async () => ({ data, error: null }));
    queries[table] = q;
  }
  const from = jest.fn((table: string) => queries[table]);
  jest.mocked(client).mockReturnValue({ from } as never);
  return { queries, from };
}
test("follow lookup is restricted to the current account and exact target, pending is not following", async () => {
  const { queries } = setup([], [{ recipient_id: "friend" }]);
  expect(
    await loadPerson("me", "friend", new AbortController().signal),
  ).toEqual({ profile, state: "requested" });
  expect(queries.profiles.eq).toHaveBeenCalledWith("id", "friend");
  expect(queries.follows.eq).toHaveBeenCalledWith("follower_id", "me");
  expect(queries.follows.eq).toHaveBeenCalledWith("following_id", "friend");
  expect(queries.follow_requests.eq).toHaveBeenCalledWith("requester_id", "me");
  expect(queries.follow_requests.eq).toHaveBeenCalledWith(
    "recipient_id",
    "friend",
  );
});
test("profile posts use only shared-post metadata, exact author, bounded pages and abort signal", async () => {
  const { queries, from } = setup();
  const signal = new AbortController().signal;
  await loadPersonPosts("friend", signal, 20);
  expect(from).toHaveBeenCalledWith("posts");
  expect(queries.posts.eq).toHaveBeenCalledWith("author_id", "friend");
  expect(queries.posts.range).toHaveBeenCalledWith(20, 40);
  expect(queries.posts.abortSignal).toHaveBeenCalledWith(signal);
  expect(queries.posts.select.mock.calls[0][0]).not.toMatch(
    /route|notes|backups/,
  );
});
