import { View } from "react-native";
import type { Workout } from "../features/activities/model";
import SportIcon from "./SportIcon";
import WorkoutStats from "./WorkoutStats";
import { Txt, useTheme } from "./ui";

/** The same readable summary before saving, in the log and before sharing. */
export default function WorkoutOverview({
  workout,
}: {
  workout: Pick<
    Workout,
    | "title"
    | "sport"
    | "date"
    | "seconds"
    | "distance"
    | "source"
    | "maxSpeedKmh"
  >;
}) {
  const c = useTheme();
  return (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <View
          style={{ backgroundColor: c.raised, padding: 12, borderRadius: 20 }}
        >
          <SportIcon sport={workout.sport} size={36} />
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt size={22} weight="700">
            {workout.title || workout.sport}
          </Txt>
          <Txt size={13} muted>
            {workout.sport} ·{" "}
            {new Date(workout.date).toLocaleDateString("nb-NO", {
              day: "numeric",
              month: "short",
            })}
            {workout.source === "simulation" ? " · Simulering" : ""}
            {workout.source === "example" ? " · Eksempel" : ""}
          </Txt>
        </View>
      </View>
      <View
        style={{ padding: 18, borderRadius: 20, backgroundColor: c.raised }}
      >
        <WorkoutStats
          sport={workout.sport}
          seconds={workout.seconds}
          distance={workout.distance}
          timerOnly={workout.source === "timer"}
          maxSpeed={workout.maxSpeedKmh}
        />
      </View>
    </View>
  );
}
