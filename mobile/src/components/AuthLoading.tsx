import { message as uiText } from "../i18n/language";
import { useState } from "react";
import { retryAuthInitialization, useAuthStore } from "../stores/useAuthStore";
import { Button, Screen, Txt } from "./ui";

export function AuthLoading() {
  const slow = useAuthStore((s) => s.initializationSlow);
  const [retrying, setRetrying] = useState(false);
  return (
    <Screen>
      <Txt>{uiText("Laster konto …")}</Txt>
      {slow && (
        <>
          <Txt>{uiText("Det tar litt tid å gjenopprette innloggingen. Kontroller nettforbindelsen og prøv igjen.")}</Txt>
          <Button
            title={retrying ? uiText("Henter konto …") : uiText("Prøv igjen")}
            disabled={retrying}
            onPress={() => {
              setRetrying(true);
              void retryAuthInitialization().finally(() => setRetrying(false));
            }}
          />
        </>
      )}
    </Screen>
  );
}
