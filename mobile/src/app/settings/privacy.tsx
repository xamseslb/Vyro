import { message as uiText } from "../../i18n/language";
import { router } from "expo-router";
import {
  ChoiceRow,
  Page,
  PageNote,
  SettingsGroup,
  SettingsRow,
} from "../../components/SettingsUi";
import { useAuthStore } from "../../stores/useAuthStore";
import { useAppStore } from "../../stores/useAppStore";
import ProfilePrivacy from "../../components/ProfilePrivacy";
import { useOwnProfile } from "../../features/auth/useOwnProfile";
import { WORKOUT_SHARING_RADIUS_METERS } from "../../features/social/routePrivacy";
export default function PrivacySettings() {
  const userId = useAuthStore((s) => s.session?.user.id);
  const { profile } = useOwnProfile();
  const audience = useAppStore((s) =>
    userId ? (s.sharingAudienceByOwner?.[userId] ?? "followers") : "followers",
  );
  function choose(value: "followers" | "everyone") {
    if (!userId || useAuthStore.getState().session?.user.id !== userId) return;
    const store = useAppStore.getState();
    store.preferences({
      sharingAudienceByOwner: {
        ...store.sharingAudienceByOwner,
        [userId]: value,
      },
    });
  }
  return (
    <Page title={uiText("Personvern og deling")}>
      <PageNote>{uiText("Du velger hva du deler. Nye økter er alltid private. Ingen innstilling her publiserer øktene dine automatisk.")}</PageNote>
      {userId && <ProfilePrivacy key={userId} />}
      {userId && (
        <SettingsGroup title={uiText("Trygghet")}>
          <SettingsRow
            title={uiText("Blokkerte brukere")}
            onPress={() => router.push("/settings/blocked")}
          />
        </SettingsGroup>
      )}
      <SettingsGroup
        title={uiText("Når du velger å dele")}
        note={uiText("Dette er et forvalg for nye innlegg på denne enheten. Du bekrefter publikum før publisering. Gamle innlegg endres ikke.")}
      >
        {userId ? (
          <>
            <ChoiceRow
              title={uiText("Følgere")}
              description={uiText("Personene som følger deg i VYRO.")}
              selected={!!profile?.is_private || audience === "followers"}
              onPress={() => choose("followers")}
            />
            {!profile?.is_private && (
              <ChoiceRow
                title={uiText("Alle innloggede")}
                description={uiText("Andre VYRO-brukere kan se innlegget.")}
                selected={audience === "everyone"}
                onPress={() => choose("everyone")}
              />
            )}
          </>
        ) : (
          <SettingsRow
            title={uiText("Logg inn for å velge publikum")}
            onPress={() => router.push("/account")}
          />
        )}
      </SettingsGroup>
      <SettingsGroup title={uiText("Beskyttelse av ruten")}>
        <SettingsRow
          title={uiText("Skjerm start og slutt")}
          value={uiText("{0} meter", WORKOUT_SHARING_RADIUS_METERS)}
          description={uiText("Punkter nær start og slutt fjernes fra kartet du deler. Kontroller alltid forhåndsvisningen før publisering.")}
          icon="lock"
        />
        <SettingsRow
          title={uiText("Kart på låseskjermen")}
          description={uiText("Velg om siste kartutsnitt og økttall skal være synlige på låst iPhone.")}
          onPress={() => router.push("/training-settings")}
        />
      </SettingsGroup>
      <SettingsGroup title={uiText("Kontoinformasjon")}>
        <SettingsRow
          title={uiText("Profil og etternavn")}
          description={uiText("Visningsnavn og brukernavn er synlige for andre. Etternavn og øvrige profildetaljer er private.")}
          onPress={() => router.push("/edit-profile")}
        />
        <SettingsRow
          title={uiText("Privat sikkerhetskopi")}
          description={uiText("Administrer lagring og gjenoppretting av øktene dine.")}
          onPress={() => router.push("/settings/data")}
        />
      </SettingsGroup>
    </Page>
  );
}
