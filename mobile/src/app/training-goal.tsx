import { router } from "expo-router";
import { AccountGate } from "../components/AccountGate";
import { GoalEditor } from "../components/GoalEditor";
import { defaultGoal } from "../features/activities/training";
import { useAppStore } from "../stores/useAppStore";
import { useAuthStore } from "../stores/useAuthStore";
export default function TrainingGoal() {
  const id = useAuthStore((s) => s.session?.user.id);
  const legacyGoal = useAppStore((s) => s.goal);
  const goals = useAppStore((s) => s.weeklyGoals);
  const workouts = useAppStore((s) => s.workouts);
  return (
    <AccountGate>
      {id && (
        <GoalEditor
          key={id}
          workouts={workouts}
          owner={id}
          goal={
            goals?.[id] ?? {
              ...defaultGoal,
              target: legacyGoal || defaultGoal.target,
            }
          }
          close={() =>
            router.canGoBack() ? router.back() : router.replace("/profile")
          }
          save={(goal) => {
            if (useAuthStore.getState().session?.user.id !== id) return;
            const s = useAppStore.getState();
            s.preferences({
              weeklyGoals: { ...s.weeklyGoals, [id]: goal },
            });
            if (router.canGoBack()) router.back();
            else router.replace("/profile");
          }}
        />
      )}
    </AccountGate>
  );
}
