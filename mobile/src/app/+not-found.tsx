import { message as uiText } from "../i18n/language";
import { router } from "expo-router";
import { Button, Screen, Txt } from "../components/ui";

export default function NotFound() {
  return (
    <Screen>
      <Txt size={28} weight="700">{uiText("Siden finnes ikke")}</Txt>
      <Txt muted>{uiText("Lenken kan være gammel eller ufullstendig.")}</Txt>
      <Button title={uiText("Tilbake til VYRO")} onPress={() => router.replace("/")} />
    </Screen>
  );
}
