import { message as uiText } from "../../i18n/language";
import { ChoiceRow, Page, SettingsGroup } from "../../components/SettingsUi";
import { useAppStore } from "../../stores/useAppStore";
export default function AppearanceSettings() {
  const theme = useAppStore((s) => s.theme);
  const preferences = useAppStore((s) => s.preferences);
  return (
    <Page title={uiText("Utseende")}>
      <SettingsGroup
        title={uiText("Velg utseende")}
        note={uiText("Valget lagres på denne enheten og gjelder hele appen. Kartet har egne farger for god lesbarhet.")}
      >
        {(
          [
            [
              "system",
              "Følg telefonen",
              "Bytt automatisk med telefonens lyse og mørke modus.",
            ],
            ["light", "Lyst", "Lys bakgrunn og mørk tekst."],
            ["dark", "Mørkt", "Dempet bakgrunn for rolige kveldsturer."],
          ] as const
        ).map(([value, title, description]) => (
          <ChoiceRow
            key={value}
            title={uiText(title)}
            description={uiText(description)}
            selected={theme === value}
            onPress={() => preferences({ theme: value })}
          />
        ))}
      </SettingsGroup>
    </Page>
  );
}
