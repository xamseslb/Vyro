import AsyncStorage from "@react-native-async-storage/async-storage";
import { appPersistence, useAppStore } from "../src/stores/useAppStore";
import { km } from "../src/features/activities/model";
import { sportSections } from "../src/features/activities/sports";
import { message } from "../src/i18n/language";
import english from "../src/i18n/en.json";

jest.mock("../src/lib/workoutStorage", () => ({
  workoutStorage: require("@react-native-async-storage/async-storage"),
}));

async function restore(preferences: Record<string, unknown>) {
  await appPersistence.retry();
  await AsyncStorage.setItem("vyro-prototype-v1", JSON.stringify({
    version: 2, state: { ...preferences, workouts: [] },
  }));
  await useAppStore.persist.rehydrate();
}

test("existing installs get a language choice and the selected language survives reopening", async () => {
  await restore({});
  expect(useAppStore.getState().language).toBeNull();
  useAppStore.getState().preferences({ language: "en" });
  await useAppStore.persist.rehydrate();
  expect(useAppStore.getState().language).toBe("en");
  expect(message("Aktiviteter")).toBe("Activities");
  expect(km(1.2)).toBe("1.20");
  expect(sportSections("running").flatMap(s => s.data)).toContain("Løping");
  useAppStore.getState().preferences({ language: "nb" });
  expect(km(1.2)).toBe("1,20");
  expect(sportSections("løp").flatMap(s => s.data)).toContain("Løping");
  await restore({ language: "unsupported" });
  expect(useAppStore.getState().language).toBeNull();
});

test("all translations keep their placeholders and interpolation preserves user content", async () => {
  const markers = (s: string) => (s.match(/\{\d+\}/g) ?? []).sort();
  for (const [source, translation] of Object.entries(english)) {
    expect([source, markers(translation)]).toEqual([source, markers(source)]);
  }
  await restore({ language: "en" });
  expect(message("{0} i dag", "Min tur {0}")).toContain("Min tur {0}");
});
