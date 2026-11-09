import { message as uiText, displayLocale } from "../i18n/language";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Workout } from "../features/activities/model";
import { Card, Icon, Txt, styles, useTheme } from "./ui";
import WorkoutStats from "./WorkoutStats";
import SportIcon from "./SportIcon";
export function ActivityCard({ workout }: { workout: Workout }) {
  const c = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={uiText("Åpne {0}", workout.title)}
      onPress={() =>
        router.push({ pathname: "/activity/[id]", params: { id: workout.id } })
      }
    >
      <Card
        style={{
          padding: 0,
          paddingBottom: 24,
          borderBottomWidth: 1,
          borderRadius: 0,
        }}
      >
        <View style={styles.row}>
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              alignItems: "center",
              flex: 1,
            }}
          >
            <View
              style={{
                padding: 6,
                borderRadius: 16,
                backgroundColor: c.raised,
              }}
            >
              <SportIcon sport={workout.sport} size={40} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt weight="600">{workout.title}</Txt>
              <Txt size={12} muted>
                {uiText(workout.sport)} ·{" "}
                {new Date(workout.date).toLocaleDateString(displayLocale(), {
                  day: "numeric",
                  month: "short",
                })}
              </Txt>
            </View>
          </View>
          <Icon name="arrow" size={18} color={c.muted} />
        </View>
        <WorkoutStats
          sport={workout.sport}
          seconds={workout.seconds}
          distance={workout.distance}
          timerOnly={workout.source === "timer"}
          maxSpeed={workout.maxSpeedKmh}
        />
        <Txt size={10} muted>
          {workout.source === "example"
            ? "EKSEMPELDATA"
            : workout.source === "gps"
              ? uiText("GPS-ØKT")
              : workout.source === "timer"
                ? "TIDTAKING"
                : uiText("SIMULERT ØKT")}{" "}{uiText("· PRIVAT")}</Txt>
      </Card>
    </Pressable>
  );
}
