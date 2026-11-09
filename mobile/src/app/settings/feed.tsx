import { message as uiText } from "../../i18n/language";
import { ChoiceRow, Page, SettingsGroup } from "../../components/SettingsUi";
import { useAppStore } from "../../stores/useAppStore";
export default function FeedSettings() {
  const feed = useAppStore((s) => s.homeFeed ?? "following");
  const preferences = useAppStore((s) => s.preferences);
  return (
    <Page title={uiText("Hjem og innhold")}>
      <SettingsGroup
        title={uiText("Startvisning på Hjem")}
        note={uiText("Innlegg vises med de nyeste først. Øktene dine forblir private til du deler dem.")}
      >
        <ChoiceRow
          title={uiText("Følger")}
          description={uiText("Innlegg fra deg og personene du følger.")}
          selected={feed === "following"}
          onPress={() => preferences({ homeFeed: "following" })}
        />
        <ChoiceRow
          title={uiText("Delt på nytt")}
          description={uiText("Innlegg du har delt videre.")}
          selected={feed === "reposted"}
          onPress={() => preferences({ homeFeed: "reposted" })}
        />
        <ChoiceRow
          title={uiText("Mine økter")}
          description={uiText("Dine private økter på denne enheten.")}
          selected={feed === "own"}
          onPress={() => preferences({ homeFeed: "own" })}
        />
      </SettingsGroup>
    </Page>
  );
}
