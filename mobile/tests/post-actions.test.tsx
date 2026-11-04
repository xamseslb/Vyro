import { fireEvent, render, screen } from "@testing-library/react-native";
import { PostActions } from "../src/components/PostActions";

jest.mock("../src/components/ui", () => ({
  Txt: require("react-native").Text,
  Icon: ({ name }: { name: string }) =>
    require("react").createElement(require("react-native").View, {
      testID: name,
    }),
  useTheme: () => ({ text: "#11182C", accent: "#356618", raised: "#F3F4F2" }),
}));

test("icon controls expose labels, selected state and a minimum 48-point target", async () => {
  const like = jest.fn(),
    comment = jest.fn(),
    repost = jest.fn();
  await render(
    <PostActions
      liked
      likeCount={3}
      reposted={false}
      onLike={like}
      onComment={comment}
      onRepost={repost}
    />,
  );
  expect(screen.queryByText("Kommentarer")).toBeNull();
  expect(screen.getByTestId("message")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Likt · 3" })).toBeSelected();
  for (const button of screen.getAllByRole("button"))
    expect(button).toHaveStyle({ minHeight: 48, minWidth: 48 });
  await fireEvent.press(screen.getByLabelText("Likt · 3"));
  await fireEvent.press(screen.getByLabelText("Kommentarer"));
  await fireEvent.press(screen.getByLabelText("Del på nytt"));
  expect(like).toHaveBeenCalledTimes(1);
  expect(comment).toHaveBeenCalledTimes(1);
  expect(repost).toHaveBeenCalledTimes(1);
});

test("pending reactions do not prevent opening comments", async () => {
  const like = jest.fn(),
    comment = jest.fn();
  await render(
    <PostActions
      liked={false}
      likeCount={0}
      reposted
      disabled
      onLike={like}
      onComment={comment}
      onRepost={() => {}}
    />,
  );
  expect(screen.getByLabelText("Angre repost")).toBeSelected();
  await fireEvent.press(screen.getByLabelText("Lik · 0"));
  await fireEvent.press(screen.getByLabelText("Kommentarer"));
  expect(like).not.toHaveBeenCalled();
  expect(comment).toHaveBeenCalledTimes(1);
});
