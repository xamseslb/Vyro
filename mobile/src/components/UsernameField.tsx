import { message as uiText } from "../i18n/language";
import { TextInput, View } from "react-native";
import { Txt, useTheme } from "./ui";

export function UsernameField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const c = useTheme();
  return (
    <View style={{ gap: 6 }}>
      <Txt weight="700">{uiText("Brukernavn")}</Txt>
      <View
        style={{
          minHeight: 52,
          paddingHorizontal: 14,
          flexDirection: "row",
          alignItems: "center",
          borderWidth: 1,
          borderColor: c.border,
          borderRadius: 14,
          backgroundColor: c.raised,
        }}
      >
        <Txt muted>@</Txt>
        <TextInput
          accessibilityLabel={uiText("Brukernavn")}
          placeholder="ditt_brukernavn"
          placeholderTextColor={c.muted}
          value={value}
          onChangeText={onChange}
          editable={!disabled}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={25}
          style={{ flex: 1, padding: 10, fontSize: 16, color: c.text }}
        />
      </View>
      <Txt muted size={13}>{uiText("Dette navnet kan vennene dine søke etter.")}</Txt>
    </View>
  );
}
