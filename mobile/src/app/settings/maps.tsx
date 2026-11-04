import { ChoiceRow, Page, SettingsGroup } from "../../components/SettingsUi";
import { useAppStore } from "../../stores/useAppStore";
import { Platform } from "react-native";
import { mapboxAvailability } from "../../features/maps/provider";
export default function MapSettings() {
  const selected = useAppStore((s) => s.defaultMapKind ?? "standard");
  const provider = useAppStore((s) => s.mapProvider);
  const available = mapboxAvailability();
  return (
    <Page title="Kart">
      {Platform.OS === "ios" && (
        <SettingsGroup
          title="Kartleverandør"
          note="Bytt når du vil. Treningsøktene og GPS-målingen beholdes. Låseskjerm og Apple Watch bruker fortsatt Apple-kart."
        >
          <ChoiceRow
            title="Apple Maps"
            description="iPhonens innebygde kart."
            selected={provider !== "mapbox"}
            onPress={() =>
              useAppStore.getState().preferences({ mapProvider: "apple" })
            }
          />
          <ChoiceRow
            title="Mapbox"
            disabled={available !== "ready"}
            description={
              available === "build"
                ? "Krever den nye testversjonen av VYRO."
                : available === "token"
                  ? "Mapbox er ikke konfigurert i dette bygget."
                  : "Prøv alternative satellittbilder og 3D-terreng."
            }
            selected={provider === "mapbox"}
            onPress={() =>
              useAppStore.getState().preferences({ mapProvider: "mapbox" })
            }
          />
        </SettingsGroup>
      )}
      <SettingsGroup
        title="Kartlag"
        note="Valget brukes i Kart og under trening. Du kan også bytte kartlag direkte i kartet."
      >
        {(
          [
            ["standard", "Standard", "Tydelige veier, stier og stedsnavn."],
            [
              "satellite",
              "Satellitt",
              "Fly- og satellittbilder uten ekstra veietiketter.",
            ],
            ["hybrid", "Hybrid", "Satellittbilder med veier og stedsnavn."],
          ] as const
        ).map(([value, title, description]) => (
          <ChoiceRow
            key={value}
            title={title}
            description={description}
            selected={selected === value}
            onPress={() =>
              useAppStore.getState().preferences({ defaultMapKind: value })
            }
          />
        ))}
      </SettingsGroup>
    </Page>
  );
}
