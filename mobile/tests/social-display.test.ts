import { personName, visibleUsername } from "../src/features/social/display";
import { profileShareText } from "../src/features/social/profileShareText";

test("only machine-generated handles are hidden, never chosen runner names", () => {
  expect(visibleUsername("runner_e85ffea8a1e7416c834b2c79e9d65617")).toBeNull();
  expect(visibleUsername("runner_alex")).toBe("@runner_alex");
  expect(visibleUsername("xamse")).toBe("@xamse");
});

test("sharing uses the display name for generated handles and keeps intentional handles searchable", () => {
  const username = "runner_e85ffea8-a1e7-416c-834b-2c79e9d65617";
  const p = { id: "uuid", display_name: "Mina", username };
  expect(profileShareText(p)).toContain("«Mina»");
  expect(profileShareText(p)).not.toContain("runner_");
  expect(profileShareText({ ...p, username: "mina_runs" })).toContain("«@mina_runs»");
  expect(personName(username)).toBe("VYRO-bruker");
  expect(visibleUsername("@mina_runs")).toBe("@mina_runs");
});
