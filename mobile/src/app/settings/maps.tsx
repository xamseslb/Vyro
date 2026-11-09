import { message as uiText } from "../../i18n/language";
import { ChoiceRow, Page, SettingsGroup } from "../../components/SettingsUi";
import { useAppStore } from "../../stores/useAppStore";
export default function MapSettings() {
  const selected = useAppStore((s) => s.defaultMapKind ?? "standard");
  return (
    <Page title={uiText("Standardkart")}>
      <SettingsGroup
        title={uiText("Kartlag")}
        note={uiText("Valget brukes i Kart og under trening. Du kan også bytte kartlag direkte i kartet.")}
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
            title={uiText(title)}
            description={uiText(description)}
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
