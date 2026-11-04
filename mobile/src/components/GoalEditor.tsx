import { useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { Button, Chip, Icon, Txt, styles, useTheme } from "./ui";
import { Page } from "./SettingsUi";
import { ProgressLine } from "./motion";
import SportPicker from "./SportPicker";
import SportIcon from "./SportIcon";
import { selectableSports, sportInfo } from "../features/activities/sports";
import {
  goalProgress,
  goalUnit,
  type WeeklyGoal,
} from "../features/activities/training";
import type { Workout } from "../features/activities/model";
import { brand } from "../theme/tokens";

const metrics = [
  {
    kind: "distance",
    label: "Distanse",
    icon: "map",
    step: 1,
    presets: [5, 10, 20, 30],
  },
  {
    kind: "minutes",
    label: "Tid",
    icon: "clock",
    step: 15,
    presets: [60, 90, 150, 240],
  },
  {
    kind: "sessions",
    label: "Økter",
    icon: "check",
    step: 1,
    presets: [2, 3, 4, 5],
  },
] as const;
const format = (value: number) =>
  value.toLocaleString("nb-NO", { maximumFractionDigits: 1 });

export function GoalEditor({
  goal,
  save,
  close,
  workouts = [],
  owner,
  now = new Date(),
}: {
  goal: WeeklyGoal;
  save: (goal: WeeklyGoal) => void;
  close: () => void;
  workouts?: Workout[];
  owner?: string;
  now?: Date;
}) {
  const c = useTheme();
  const [sport, setSport] = useState<WeeklyGoal["sport"]>(
    goal.sport === "Alle" || selectableSports.includes(goal.sport)
      ? goal.sport
      : "Alle",
  );
  const [kind, setKind] = useState(goal.kind);
  const [amounts, setAmounts] = useState({
    distance: "20",
    minutes: "90",
    sessions: "3",
    [goal.kind]: String(goal.target),
  });
  const [chooseSport, setChooseSport] = useState(false);
  const target = amounts[kind];
  const number = Number(target.trim().replace(",", "."));
  const distanceAllowed = sport === "Alle" || sportInfo(sport).gps;
  const valid =
    Number.isFinite(number) &&
    number > 0 &&
    number <= 10000 &&
    (kind !== "sessions" || Number.isInteger(number)) &&
    (kind !== "distance" || distanceAllowed);
  const draft = { kind, sport, target: valid ? number : 1 };
  const progress = goalProgress(workouts, draft, owner, now);
  const metric = metrics.find((m) => m.kind === kind)!;
  const unit = goalUnit(draft);
  const setTarget = (value: string) =>
    setAmounts((old) => ({ ...old, [kind]: value }));
  const card = {
    backgroundColor: c.surface,
    borderRadius: 24,
    padding: 20,
    gap: 18,
  };
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const date = (d: Date) =>
    d.toLocaleDateString("nb-NO", { day: "numeric", month: "short" });
  return (
    <Page
      title="Treningsmål"
      fallback="/profile"
      onBack={close}
      footer={
        <Button
          title="Lagre ukemål"
          icon="check"
          disabled={!valid}
          onPress={() => save({ kind, sport, target: number })}
        />
      }
    >
      <View style={{ padding: 16, gap: 16 }}>
        <View
          style={{
            backgroundColor: brand.navy,
            borderRadius: 24,
            padding: 22,
            gap: 16,
          }}
        >
          <View style={[styles.row, { flexWrap: "wrap", gap: 8 }]}>
            <Txt size={13} weight="600" style={{ color: brand.lime }}>
              DENNE UKEN
            </Txt>
            <Txt size={12} style={{ color: "#D1D7E4" }}>
              {date(monday)}–{date(sunday)}
            </Txt>
          </View>
          <Txt size={26} weight="700" style={{ color: "white" }}>
            Litt nærmere målet.
          </Txt>
          <View
            style={{
              flexDirection: "row",
              alignItems: "baseline",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <Txt
              size={40}
              weight="800"
              style={{ color: "white", fontVariant: ["tabular-nums"] }}
            >
              {format(progress.value)}
            </Txt>
            <Txt size={16} style={{ color: "#D1D7E4" }}>
              av {valid ? format(number) : "—"} {unit}
            </Txt>
          </View>
          <ProgressLine
            label="Fremgang mot ukemålet"
            value={valid ? progress.fraction : 0}
            color={brand.lime}
            background="#344056"
          />
          <Txt size={13} style={{ color: "#D1D7E4" }}>
            {!valid
              ? "Velg målet ditt nedenfor."
              : progress.remaining === 0
                ? "Ukemålet er nådd. Godt jobbet!"
                : `${format(progress.remaining)} ${unit} igjen · ${sport === "Alle" ? "Alle idretter" : sport}`}
          </Txt>
        </View>
        <View style={card}>
          <Txt size={18} weight="700">
            Hva vil du måle?
          </Txt>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {metrics.map((m) => (
              <Pressable
                key={m.kind}
                accessibilityRole="radio"
                accessibilityLabel={m.label}
                accessibilityState={{
                  checked: kind === m.kind,
                  disabled: m.kind === "distance" && !distanceAllowed,
                }}
                disabled={m.kind === "distance" && !distanceAllowed}
                onPress={() => setKind(m.kind)}
                style={{
                  flex: 1,
                  minHeight: 72,
                  borderRadius: 16,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  backgroundColor: kind === m.kind ? brand.lime : c.raised,
                  opacity: m.kind === "distance" && !distanceAllowed ? 0.4 : 1,
                }}
              >
                <Icon
                  name={m.icon}
                  size={21}
                  color={kind === m.kind ? brand.navy : c.text}
                />
                <Txt
                  size={13}
                  weight="600"
                  style={{ color: kind === m.kind ? brand.navy : c.text }}
                >
                  {m.label}
                </Txt>
              </Pressable>
            ))}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reduser ukemålet"
              onPress={() =>
                setTarget(
                  String(
                    Math.max(
                      metric.step,
                      (Number.isFinite(number) ? number : 0) - metric.step,
                    ),
                  ),
                )
              }
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: c.raised,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Txt size={26}>−</Txt>
            </Pressable>
            <View style={{ flex: 1, alignItems: "center", gap: 2 }}>
              <TextInput
                accessibilityLabel="Antall i ukemålet"
                value={target}
                onChangeText={setTarget}
                keyboardType={
                  kind === "sessions" ? "number-pad" : "decimal-pad"
                }
                selectTextOnFocus
                maxLength={7}
                style={{
                  width: "100%",
                  textAlign: "center",
                  color: c.text,
                  fontSize: 38,
                  fontWeight: "700",
                  padding: 8,
                  fontVariant: ["tabular-nums"],
                }}
              />
              <Txt muted size={13}>
                {unit} per uke
              </Txt>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Øk ukemålet"
              onPress={() =>
                setTarget(
                  String(
                    Math.min(
                      10000,
                      (Number.isFinite(number) ? number : 0) + metric.step,
                    ),
                  ),
                )
              }
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: c.raised,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Icon name="plus" size={22} color={c.text} />
            </Pressable>
          </View>
          <View style={[styles.wrap, { justifyContent: "center" }]}>
            {metric.presets.map((value) => (
              <Chip
                key={value}
                title={`${value} ${unit}`}
                selected={number === value}
                onPress={() => setTarget(String(value))}
              />
            ))}
          </View>
          {!valid && (
            <Txt size={13} accessibilityRole="alert">
              Velg et positivt tall, maks 10 000. Økter må være et heltall.
            </Txt>
          )}
        </View>
        <View style={card}>
          <Txt size={18} weight="700">
            Hvilke aktiviteter teller?
          </Txt>
          <View style={styles.wrap}>
            <Chip
              title="Alle idretter"
              selected={sport === "Alle"}
              onPress={() => setSport("Alle")}
            />
            <Chip
              title="Én idrett"
              selected={sport !== "Alle"}
              onPress={() => setChooseSport(true)}
            />
          </View>
          {sport !== "Alle" && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Endre idrett for ukemålet"
              onPress={() => setChooseSport(true)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                minHeight: 52,
                gap: 14,
              }}
            >
              <SportIcon sport={sport} size={36} />
              <Txt weight="600" style={{ flex: 1 }}>
                {sport}
              </Txt>
              <Icon name="chevronDown" color={c.muted} size={20} />
            </Pressable>
          )}
          {!distanceAllowed && (
            <Txt muted size={13}>
              Velg tid eller antall økter for denne idretten.
            </Txt>
          )}
        </View>
        <Txt
          muted
          size={12}
          style={{ textAlign: "center", paddingHorizontal: 12 }}
        >
          Mandag–søndag. Bare dine egne registrerte økter teller. Målet gjelder
          hver uke til du endrer det.
        </Txt>
      </View>
      {chooseSport && (
        <SportPicker
          selected={sport === "Alle" ? [] : [sport]}
          onClose={() => setChooseSport(false)}
          onSelect={(value) => {
            setSport(value);
            setChooseSport(false);
            if (!sportInfo(value).gps && kind === "distance")
              setKind("minutes");
          }}
        />
      )}
    </Page>
  );
}
