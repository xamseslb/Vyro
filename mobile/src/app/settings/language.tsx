import { router } from "expo-router";
import { LanguagePicker } from "../../components/LanguagePicker";
export default function LanguageSettings() {
  return <LanguagePicker onDone={() => router.canGoBack() ? router.back() : router.replace("/settings")} />;
}
