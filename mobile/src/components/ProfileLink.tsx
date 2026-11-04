import type { PropsWithChildren } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import { router } from "expo-router";
import { useAuthStore } from "../stores/useAuthStore";
import { personName } from "../features/social/display";

export function openProfile(id: string) {
  if (id === useAuthStore.getState().session?.user.id) router.push("/profile");
  else router.push({ pathname: "/person/[id]", params: { id } });
}
/** Identity is a separate hit target; never nest follow/delete controls inside it. */
export function ProfileLink({
  id,
  name,
  children,
  style,
  beforeOpen,
}: PropsWithChildren<{
  id: string;
  name?: string;
  style?: StyleProp<ViewStyle>;
  beforeOpen?: () => void;
}>) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Vis profilen til ${personName(name)}`}
      onPress={() => {
        beforeOpen?.();
        openProfile(id);
      }}
      style={({ pressed }) => [
        {
          minHeight: 44,
          justifyContent: "center",
          opacity: pressed ? 0.65 : 1,
        },
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}
