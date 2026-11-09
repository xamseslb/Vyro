import { message as uiText, displayLocale } from "../i18n/language";
import { useCallback, useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";
import { Button, Chip, Icon, Txt, styles, useTheme } from "./ui";
import { ProgressLine } from "./motion";
import { useAppStore } from "../stores/useAppStore";
import { type Sport, type Workout, km } from "../features/activities/model";
import { selectableSports } from "../features/activities/sports";
import {
  defaultGoal,
  goalProgress,
  goalUnit,
  milestones,
} from "../features/activities/training";
import { trainingProgress } from "../features/activities/progress";

export function trainingTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return minutes >= 60
    ? uiText("{0} t {1} min", Math.floor(minutes / 60), minutes % 60)
    : `${minutes} min`;
}
export function TrainingProgress({
  workouts,
  owner,
}: {
  workouts: Workout[];
  owner?: string;
}) {
  const c = useTheme();
  const [sport, setSport] = useState<Sport | "Alle">("Alle");
  const [chooseSport, setChooseSport] = useState(false);
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
    }, []),
  );
  const data = useMemo(
    () => trainingProgress(workouts, owner, sport, now),
    [workouts, owner, sport, now],
  );
  const savedGoal = useAppStore((s) =>
    owner ? s.weeklyGoals?.[owner] : undefined,
  );
  const legacyGoal = useAppStore((s) => s.goal);
  const goal = savedGoal ?? {
    ...defaultGoal,
    target: legacyGoal || defaultGoal.target,
  };
  const progress = goalProgress(workouts, goal, owner, now);
  const records = useMemo(() => milestones(workouts, owner), [workouts, owner]);
  const card = {
    backgroundColor: c.surface,
    padding: 20,
    borderRadius: 22,
    gap: 18,
  };
  return (
    <View style={{ gap: 16, padding: 16 }}>
      <View style={card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={uiText("Velg idrett for fremgang")}
          accessibilityState={{ expanded: chooseSport }}
          onPress={() => setChooseSport(!chooseSport)}
          style={{
            flexDirection: "row",
            gap: 8,
            alignItems: "center",
            alignSelf: "flex-start",
            borderWidth: 1,
            borderColor: c.accent,
            borderRadius: 22,
            paddingHorizontal: 14,
            minHeight: 42,
          }}
        >
          <Icon
            name={
              sport === "Sykling"
                ? "bike"
                : sport === "Fottur"
                  ? "mountain"
                  : "run"
            }
            color={c.accent}
            size={20}
          />
          <Txt size={13} weight="600" style={{ color: c.accent }}>
            {sport === "Alle" ? uiText("Alle aktiviteter") : uiText(sport)}
          </Txt>
          <Icon name="chevronDown" color={c.accent} size={15} />
        </Pressable>
        {chooseSport && (
          <View style={styles.wrap}>
            {(["Alle", ...selectableSports] as const).map((value) => (
              <Chip
                key={value}
                title={value}
                selected={sport === value}
                onPress={() => {
                  setSport(value);
                  setChooseSport(false);
                }}
              />
            ))}
          </View>
        )}
        <Txt size={22} weight="700">{uiText("Denne uken")}</Txt>
        <View style={{ flexDirection: "row", gap: 14 }}>
          {[
            ["Distanse", `${km(data.current.distance)} km`],
            ["Tid", trainingTime(data.current.seconds)],
            ["Økter", String(data.current.count)],
          ].map(([label, value]) => (
            <View key={label} style={{ flex: 1, gap: 6 }}>
              <Txt muted size={12}>
                {uiText(label)}
              </Txt>
              <Txt size={20} weight="700">
                {value}
              </Txt>
            </View>
          ))}
        </View>
        <Txt size={13}>{uiText("De siste 12 ukene")}</Txt>
        <WeeklyChart weeks={data.weeks} />
        <Txt muted size={11}>{uiText("Bare dine egne økter teller.")}</Txt>
      </View>
      <View style={card}>
        <View style={styles.row}>
          <Txt size={18} weight="700">{uiText("Uker på rad")}</Txt>
          <Txt muted size={12}>
            {now.toLocaleDateString(displayLocale(), { month: "long" })}
          </Txt>
        </View>
        <View style={{ flexDirection: "row", gap: 20, alignItems: "center" }}>
          <View style={{ alignItems: "center", width: 78, gap: 3 }}>
            <Icon name="run" color={c.accent} size={33} />
            <Txt size={38} weight="800">
              {data.streak}
            </Txt>
            <Txt muted size={12}>
              {data.streak === 1 ? "uke" : "uker"}
            </Txt>
          </View>
          <View
            accessibilityLabel={uiText("{0} aktive dager denne måneden", data.month.filter((d) => d.active).length)}
            style={{ flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 0 }}
          >
            {Array.from({ length: data.monthOffset }, (_, i) => (
              <View
                key={`empty-${i}`}
                style={{ width: "14.2857%", height: 27 }}
              />
            ))}
            {data.month.map((d) => (
              <View
                key={d.day}
                style={{
                  width: "14.2857%",
                  height: 27,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View
                  accessibilityLabel={`${d.day}.: ${d.active ? uiText("økt") : d.today ? uiText("i dag") : uiText("ingen økt")}`}
                  style={{
                    width: 15,
                    height: 15,
                    borderRadius: 8,
                    backgroundColor: d.active ? c.accent : c.raised,
                    borderColor: d.today ? c.text : c.raised,
                    borderWidth: d.today ? 1.5 : 0,
                    opacity: d.future ? 0.45 : 1,
                  }}
                />
              </View>
            ))}
          </View>
        </View>
        <Txt muted size={12}>{uiText("Minst én økt per uke. Du har ut denne uken på å fortsette rekken.")}</Txt>
      </View>
      <View style={card}>
        <View style={styles.row}>
          <Txt size={18} weight="700">{uiText("Ukemålet ditt")}</Txt>
          {owner && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/training-goal")}
              style={{ minHeight: 44, justifyContent: "center" }}
            >
              <Txt weight="600" size={13} style={{ color: c.accent }}>{uiText("Endre mål")}</Txt>
            </Pressable>
          )}
        </View>
        <Txt size={24} weight="700">
          {progress.value.toLocaleString(displayLocale(), { maximumFractionDigits: 1 })}{" "}
          <Txt muted size={15}>
            / {goal.target} {goalUnit(goal)}
          </Txt>
        </Txt>
        <ProgressLine
          value={progress.fraction}
          color={c.accent}
          background={c.raised}
        />
        <Txt muted size={13}>
          {uiText(goal.sport)} ·{" "}
          {progress.remaining === 0
            ? uiText("Målet er nådd!")
            : uiText("{0} {1} igjen", progress.remaining.toLocaleString("nb-NO", { maximumFractionDigits: 1 }), goalUnit(goal))}
        </Txt>
      </View>
      {!!records.longest && (
        <View style={card}>
          <Txt size={18} weight="700">{uiText("Dine milepæler")}</Txt>
          <Txt>{uiText("Lengste tur:") + " "}{km(records.longest.distance)} km</Txt>
          <Txt muted size={14}>{uiText("Mest aktive uke:") + " "}{records.bestWeek}{" " + uiText("økter")}</Txt>
        </View>
      )}
      {!workouts.length && (
        <Button title={uiText("Start en økt")} onPress={() => router.push("/track")} />
      )}
    </View>
  );
}

function WeeklyChart({
  weeks,
}: {
  weeks: ReturnType<typeof trainingProgress>["weeks"];
}) {
  const c = useTheme();
  const max = Math.max(
    6,
    Math.ceil(Math.max(...weeks.map((w) => w.distance)) / 6) * 6,
  );
  const x = (i: number) => 8 + (i / 11) * 256;
  const y = (value: number) => 126 - (value / max) * 106;
  const points = weeks.map((w, i) => `${x(i)},${y(w.distance)}`).join(" ");
  return (
    <Svg
      width="100%"
      height={170}
      viewBox="0 0 320 168"
      accessibilityRole="image"
      accessibilityLabel={uiText("Distanse de siste 12 ukene: {0}", weeks.map((w) => `${w.date.toLocaleDateString("nb-NO", { day: "numeric", month: "short" })}: ${km(w.distance)} km`).join("; "))}
    >
      {[0, max / 2, max].map((tick) => (
        <ViewlessTick
          key={tick}
          tick={tick}
          y={y(tick)}
          border={c.border}
          text={c.muted}
        />
      ))}
      <Polyline
        points={points}
        stroke={c.accent}
        strokeWidth={2.5}
        fill="none"
        strokeLinejoin="round"
      />
      {weeks.map((w, i) => (
        <Circle
          key={w.key}
          cx={x(i)}
          cy={y(w.distance)}
          r={i === 11 ? 5 : 3}
          fill={i === 11 ? c.accent : c.surface}
          stroke={c.accent}
          strokeWidth={2}
        />
      ))}
      {[0, 5, 11].map((i) => (
        <SvgText
          key={i}
          x={x(i)}
          y={157}
          textAnchor={i === 0 ? "start" : "middle"}
          fill={c.muted}
          fontSize={10}
        >
          {weeks[i].date.toLocaleDateString(displayLocale(), {
            day: "numeric",
            month: "short",
          })}
        </SvgText>
      ))}
    </Svg>
  );
}
function ViewlessTick({
  tick,
  y,
  border,
  text,
}: {
  tick: number;
  y: number;
  border: string;
  text: string;
}) {
  return (
    <>
      <Line x1={8} y1={y} x2={274} y2={y} stroke={border} strokeWidth={1} />
      <SvgText x={282} y={y + 4} fill={text} fontSize={10}>
        {tick} km
      </SvgText>
    </>
  );
}
