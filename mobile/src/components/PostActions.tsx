import { Pressable, View } from "react-native";
import { Icon, Txt, useTheme, type IconName } from "./ui";

/** Compact feed controls with full-size touch targets and spoken labels. */
export function PostActions({
  liked,
  likeCount,
  reposted,
  disabled = false,
  commentsOpen = false,
  commentCount,
  onLike,
  onComment,
  onRepost,
}: {
  liked: boolean;
  likeCount: number;
  reposted: boolean;
  disabled?: boolean;
  commentsOpen?: boolean;
  commentCount?: number;
  onLike: () => void;
  onComment: () => void;
  onRepost: () => void;
}) {
  const c = useTheme();
  const actions: {
    icon: IconName;
    label: string;
    count?: number;
    active?: boolean;
    disabled?: boolean;
    expanded?: boolean;
    onPress: () => void;
  }[] = [
    {
      icon: "heart",
      label: `${liked ? "Likt" : "Lik"} · ${likeCount}`,
      count: likeCount,
      active: liked,
      disabled,
      onPress: onLike,
    },
    {
      icon: "message",
      label: "Kommentarer",
      count: commentCount,
      expanded: commentsOpen,
      onPress: onComment,
    },
    {
      icon: "repost",
      label: reposted ? "Angre repost" : "Del på nytt",
      active: reposted,
      disabled,
      onPress: onRepost,
    },
  ];
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      {actions.map((action) => (
        <Pressable
          key={action.icon}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          accessibilityState={{
            disabled: !!action.disabled,
            selected: action.active,
            expanded: action.expanded,
          }}
          accessibilityShowsLargeContentViewer
          accessibilityLargeContentTitle={action.label}
          disabled={action.disabled}
          onPress={action.onPress}
          style={({ pressed }) => ({
            minHeight: 48,
            minWidth: 48,
            paddingHorizontal: 10,
            paddingVertical: 8,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 7,
            borderRadius: 16,
            backgroundColor: pressed ? c.raised : "transparent",
            opacity: action.disabled ? 0.4 : 1,
          })}
        >
          <Icon
            name={action.icon}
            size={25}
            color={action.active ? c.accent : c.text}
            filled={action.icon === "heart" && action.active}
          />
          {action.count != null && (
            <Txt size={14} weight="600">
              {action.count}
            </Txt>
          )}
        </Pressable>
      ))}
    </View>
  );
}
