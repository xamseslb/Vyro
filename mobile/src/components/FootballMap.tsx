import { message as uiText } from "../i18n/language";
import { useMemo, useState } from "react";
import { Pressable, View } from "react-native";
import LiveMap from "./LiveMap";
import { useAppStore } from "../stores/useAppStore";
import { Txt, useTheme } from "./ui";
import { routeSegments, type RoutePoint } from "../features/tracking/gps";
import { footballHeatmap } from "../features/football/heatmap";
export { FootballSpeed } from "./FootballSpeed";

export default function FootballMap({
  points,
  height = 310,
}: {
  points: RoutePoint[];
  height?: number;
}) {
  const c = useTheme();
  const mapKind = useAppStore(s => s.defaultMapKind);
  const [mode, setMode] = useState<"route" | "heat">("route");
  const route = useMemo(() => routeSegments(points), [points]);
  const heatmap = useMemo(() => footballHeatmap(points), [points]);
  return (
    <View style={{ gap: 12 }}>
      <View
        accessibilityRole="tablist"
        style={{
          flexDirection: "row",
          padding: 4,
          gap: 4,
          borderRadius: 18,
          backgroundColor: c.raised,
        }}
      >
        {(
          [
            ["route", "Rute"],
            ["heat", "Varmekart"],
          ] as const
        ).map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityLabel={uiText(label)}
            accessibilityState={{ selected: mode === value }}
            onPress={() => setMode(value)}
            style={{
              flex: 1,
              minHeight: 44,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 14,
              backgroundColor: mode === value ? c.bg : "transparent",
            }}
          >
            <Txt weight="700" size={14}>
              {uiText(label)}
            </Txt>
          </Pressable>
        ))}
      </View>
      <View style={{ borderRadius: 20, overflow: "hidden" }}>
        {route.some((segment) => segment.length > 1) ? (
          <LiveMap
            route={route}
            height={height}
            mapKind={mapKind}
            heatmap={mode === "heat" ? heatmap : null}
          />
        ) : (
          <Txt muted size={13}>{uiText("Ingen synlig rute i kartet.")}</Txt>
        )}
      </View>
      {mode === "heat" &&
        (heatmap ? (
          <>
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <Txt muted size={12}>{uiText("Mindre")}</Txt>
              <View
                style={{
                  flex: 1,
                  flexDirection: "row",
                  borderRadius: 5,
                  overflow: "hidden",
                }}
              >
                {["#8FEB23", "#C5EB23", "#FFEB23", "#FF9423", "#FF3C23"].map(
                  (color) => (
                    <View
                      key={color}
                      style={{ flex: 1, height: 7, backgroundColor: color }}
                    />
                  ),
                )}
              </View>
              <Txt muted size={12}>{uiText("Mer bevegelse")}</Txt>
            </View>
            <Txt muted size={12}>{uiText("Viser hvor du beveget deg mest, ikke tiden du sto stille. GPS kan avvike fra banen.")}</Txt>
          </>
        ) : (
          <Txt muted size={12}>{uiText("For lite sammenhengende GPS-rute til å vise varmekart.")}</Txt>
        ))}
    </View>
  );
}
