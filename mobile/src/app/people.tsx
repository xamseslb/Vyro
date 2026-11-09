import { message as uiText } from "../i18n/language";
import { useLocalSearchParams } from "expo-router";
import { AccountGate } from "../components/AccountGate";
import { PeopleSearch } from "../components/PeopleSearch";
import { View } from "react-native";
import { Page, PageNote } from "../components/SettingsUi";
import { useAuthStore } from "../stores/useAuthStore";
export default function People() {
  const id = useAuthStore((s) => s.session?.user.id);
  const { query } = useLocalSearchParams<{ query?: string }>();
  return (
    <AccountGate>
      {id && (
        <Page title={uiText("Finn venner")} fallback="/profile" plain>
          <PageNote>{uiText("Søk etter personer og følg dem for å se turene og stedene de deler.")}</PageNote>
          <View style={{ paddingHorizontal: 22 }}>
            <PeopleSearch
              key={`${id}:${query}`}
              userId={id}
              initialQuery={typeof query === "string" ? query : ""}
            />
          </View>
        </Page>
      )}
    </AccountGate>
  );
}
