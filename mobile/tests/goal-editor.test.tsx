import { fireEvent, render, screen } from "@testing-library/react-native";
import { GoalEditor } from "../src/components/GoalEditor";
import type { Workout } from "../src/features/activities/model";
// Includes the real modal sport picker, rather than a stub of its selection UI.
jest.setTimeout(30000);
jest.mock("../src/lib/workoutStorage", () => ({
  workoutStorage: require("@react-native-async-storage/async-storage"),
}));
jest.mock("../src/components/motion", () => ({ ProgressLine: () => null }));
const goal = {
  kind: "distance" as const,
  target: 20,
  sport: "Løping" as const,
};
test("editing is staged, invalid values cannot save, decimal comma is accepted", async () => {
  const save = jest.fn();
  await render(<GoalEditor goal={goal} save={save} close={() => {}} />);
  await fireEvent.changeText(screen.getByLabelText("Antall i ukemålet"), "0");
  expect(screen.getByText("Lagre ukemål").parent).toBeDisabled();
  await fireEvent.changeText(screen.getByLabelText("Antall i ukemålet"), "2,5");
  expect(save).not.toHaveBeenCalled();
  await fireEvent.press(screen.getByText("Lagre ukemål"));
  expect(save).toHaveBeenCalledWith({ ...goal, target: 2.5 });
});
test("goal kinds preserve their typed values and sessions reject fractional numbers", async () => {
  await render(<GoalEditor goal={goal} save={() => {}} close={() => {}} />);
  await fireEvent.changeText(screen.getByLabelText("Antall i ukemålet"), "12");
  await fireEvent.press(screen.getByRole("radio", { name: "Tid" }));
  await fireEvent.changeText(screen.getByLabelText("Antall i ukemålet"), "100");
  await fireEvent.press(screen.getByRole("radio", { name: "Distanse" }));
  expect(screen.getByDisplayValue("12")).toBeTruthy();
  await fireEvent.press(screen.getByRole("radio", { name: "Økter" }));
  await fireEvent.changeText(screen.getByLabelText("Antall i ukemålet"), "2,5");
  expect(screen.getByText("Lagre ukemål").parent).toBeDisabled();
});
test("timer-only sport selection switches to time; no distance goal is saved for strength", async () => {
  const save = jest.fn();
  await render(<GoalEditor goal={goal} save={save} close={() => {}} />);
  await fireEvent.press(screen.getByText("Én idrett"));
  await fireEvent.changeText(screen.getByPlaceholderText("Søk etter idrett"), "styrke");
  await fireEvent.press(screen.getByText("Styrketrening"));
  expect(screen.getByRole("radio", { name: "Distanse" })).toBeDisabled();
  await fireEvent.press(screen.getByText("Lagre ukemål"));
  expect(save).toHaveBeenCalledWith({
    kind: "minutes",
    target: 90,
    sport: "Styrketrening",
  });
});
test("weekly preview excludes other accounts, simulations and older workouts", async () => {
  const w: Workout = {
    id: "a",
    ownerId: "me",
    title: "Tur",
    sport: "Løping",
    source: "gps",
    date: "2026-11-03T12:00:00Z",
    seconds: 1200,
    distance: 4,
    notes: "",
    visibility: "private",
  };
  await render(
    <GoalEditor
      goal={goal}
      save={() => {}}
      close={() => {}}
      owner="me"
      now={new Date("2026-11-04T12:00:00Z")}
      workouts={[
        w,
        { ...w, id: "b", ownerId: "other", distance: 100 },
        { ...w, id: "c", source: "simulation", distance: 100 },
        { ...w, id: "d", date: "2026-10-01T12:00:00Z", distance: 100 },
      ]}
    />,
  );
  expect(screen.getByText("16 km igjen · Løping")).toBeTruthy();
});

jest.mock("../src/components/ui", () => {
  const React = jest.requireActual("react");
  const { View, Text, Pressable } = jest.requireActual("react-native");
  return {
    Txt: Text,
    Screen: View,
    Icon: () => null,
    styles: {},
    useTheme: () => ({
      text: "#11182C",
      surface: "white",
      raised: "#eee",
      border: "#ddd",
      muted: "#555",
      accent: "green",
      onAccent: "white",
    }),
    Chip: ({
      title,
      selected,
      onPress,
    }: {
      title: string;
      selected: boolean;
      onPress: () => void;
    }) =>
      React.createElement(
        Pressable,
        {
          onPress,
          accessibilityRole: "button",
          accessibilityState: { selected },
        },
        React.createElement(Text, null, title),
      ),
    Button: ({
      title,
      disabled,
      onPress,
    }: {
      title: string;
      disabled: boolean;
      onPress: () => void;
    }) =>
      React.createElement(
        Pressable,
        { accessibilityRole: "button", disabled, onPress },
        React.createElement(Text, null, title),
      ),
  };
});
