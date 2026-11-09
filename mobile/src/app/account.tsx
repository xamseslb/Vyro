import { message as uiText } from "../i18n/language";
import { preparePushSignOut } from "../features/social/push";
import { useRef, useState } from "react";
import { Pressable, TextInput, View } from "react-native";
import { BrandWordmark } from "../components/Brand";
import { VyroPublicLinks } from "../components/VyroPublicLinks";
import { UsernameField } from "../components/UsernameField";
import { normalizeUsername, usernameProblem, usernameTaken } from "../features/auth/username";
import { router, useLocalSearchParams } from "expo-router";
import { Button, Txt, useTheme } from "../components/ui";
import { supabase } from "../lib/supabase";
import { acceptAuthSession, useAuthStore } from "../stores/useAuthStore";
import {
  AccountMode,
  authErrorMessage,
  validateAccount,
} from "../features/auth/validation";
import { authRedirectUrl } from "../features/auth/links";
import { AuthLoading } from "../components/AuthLoading";
import { SocialSignIn } from "../components/SocialSignIn";
import { Page } from "../components/SettingsUi";
import { AccountLastName } from "../components/AccountLastName";
import { signInWithApple } from "../features/auth/apple";
import { signInWithBrowser } from "../features/auth/socialBrowser";
import type { SocialProvider } from "../features/auth/socialConfig";

export default function Account() {
  const params = useLocalSearchParams<{ mode?: string }>();
  const c = useTheme();
  const { session, ready, confirmationEmail } = useAuthStore();
  const [mode, setMode] = useState<AccountMode>(
    params.mode === "register" ? "register" : "login",
  );
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(confirmationEmail ?? "");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState("");
  const pending = useRef(false);
  const [message, setMessage] = useState("");
  const pendingEmail =
    !!confirmationEmail && confirmationEmail === email.trim();
  const register = mode === "register";
  const input = {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: c.text,
  };

  async function run(title: string, action: () => Promise<void>) {
    if (!supabase || pending.current) return;
    pending.current = true;
    setBusy(title);
    setMessage("");
    try {
      await action();
    } catch (error) {
      if ((error as { code?: string }).code === "email_not_confirmed")
        useAuthStore.setState({ confirmationEmail: email.trim() });
      setMessage(authErrorMessage(error));
    } finally {
      pending.current = false;
      setBusy("");
    }
  }

  async function submit() {
    if (!supabase || pending.current) return;
    const handle = normalizeUsername(username);
    const validation = validateAccount({
      mode,
      name,
      lastName,
      email,
      password,
      confirmation,
    }) || (register ? usernameProblem(handle) : undefined);
    if (validation) {
      setMessage(validation);
      return;
    }
    const client = supabase;
    await run(
      mode === "reset"
        ? uiText("Sender lenke …")
        : register
          ? uiText("Oppretter konto …")
          : uiText("Logger inn …"),
      async () => {
        if (mode === "reset") {
          const { error } = await client.auth.resetPasswordForEmail(
            email.trim(),
            { redirectTo: authRedirectUrl() },
          );
          if (error) throw error;
          setMessage(
            uiText("Hvis adressen har en konto, får du en lenke for å velge nytt passord. Åpne lenken på denne enheten."),
          );
          return;
        }
        if (register) {
          const available = await client.rpc("vyro_username_available", { candidate: handle });
          if (available.error) throw available.error;
          if (available.data !== true) { setMessage(usernameTaken); return; }
        }
        const { data, error } = register
          ? await client.auth.signUp({
              email: email.trim(),
              password,
              options: {
                data: {
                  vyro_username: handle,
                  display_name: name.trim(),
                  ...(lastName.trim() ? { last_name: lastName.trim() } : {}),
                },
                emailRedirectTo: authRedirectUrl(),
              },
            })
          : await client.auth.signInWithPassword({
              email: email.trim(),
              password,
            });
        if (error) {
          if (register && error.status === 500) {
            const check = await client.rpc("vyro_username_available", { candidate: handle });
            if (check.data === false) { setMessage(usernameTaken); return; }
          }
          throw error;
        }
        setPassword("");
        setConfirmation("");
        if (data.session) {
          acceptAuthSession(data.session);
          router.replace("/(tabs)");
        } else if (register) {
          useAuthStore.setState({ confirmationEmail: email.trim() });
          setMode("login");
          setMessage(
            uiText("For en ny konto: sjekk e-posten og søppelposten, og åpne bekreftelseslenken på denne enheten. Har du konto fra før, logg inn med det opprinnelige passordet. Registrering på nytt endrer ikke passordet ditt."),
          );
        } else {
          throw new Error("Missing session after sign-in");
        }
      },
    );
  }

  function changeMode(next: AccountMode) {
    setMode(next);
    setMessage("");
    setPassword("");
    setConfirmation("");
    setVisible(false);
  }

  function socialSignIn(provider: SocialProvider) {
    void run(
      uiText("Åpner {0} …", provider === "apple" ? "Apple" : "Google"),
      async () => {
        const result =
          provider === "apple"
            ? await signInWithApple()
            : await signInWithBrowser("google");
        if (result === "signed_in") router.replace("/(tabs)");
      },
    );
  }

  if (!ready && !session) return <AuthLoading />;

  return (
    <Page
      title={
        session
          ? uiText("Konto")
          : mode === "reset"
            ? uiText("Glemt passord")
            : register
              ? uiText("Opprett konto")
              : uiText("Logg inn")
      }
      fallback="/(tabs)"
      backDisabled={!!busy}
      plain
    >
      <View style={{ padding: 22, gap: 16, width: "100%", maxWidth: 480, alignSelf: "center" }}>
        {!session && register ? (
          <View style={{ gap: 12, paddingVertical: 16 }}>
            <BrandWordmark width={118} color={c.text} />
            <Txt size={30} weight="700">{uiText("Opprett din profil")}</Txt>
            <Txt muted>{uiText("Registrer deg med e-post eller fortsett med en konto under.")}</Txt>
          </View>
        ) : !session && (
          <Txt muted size={15}>
            {mode === "reset"
                ? uiText("Vi sender deg en lenke for å velge et nytt passord.")
                : uiText("Velkommen tilbake. Turene dine venter.")}
          </Txt>
        )}
        {!supabase && (
          <Txt>{uiText("Innlogging er ikke satt opp på denne enheten ennå.")}</Txt>
        )}
        {session ? (
          <>
            <Txt>{uiText("Du er innlogget i hele VYRO.")}</Txt>
            <Txt>{session.user.email}</Txt>
            <AccountLastName key={session.user.id} user={session.user} />
            <Button
              title={busy || uiText("Logg ut")}
              disabled={!!busy}
              onPress={() =>
                void run(uiText("Logger ut …"), async () => {
                  await preparePushSignOut(useAuthStore.getState().session!.user.id);
                  const result = await supabase!.auth.signOut({
                    scope: "local",
                  });
                  if (result.error) throw result.error;
                  acceptAuthSession(null);
                  useAuthStore.setState({ confirmationEmail: null });
                  router.replace("/(tabs)");
                })
              }
            />
          </>
        ) : (
          <>
            {mode !== "reset" && (
              <SocialSignIn
                disabled={!!busy || !supabase}
                onPress={socialSignIn}
              />
            )}
            {pendingEmail && mode === "login" && (
              <Txt muted>{uiText("Har du konto fra før? Bruk det opprinnelige passordet, eller velg «Glemt passord?».")}</Txt>
            )}
            {register && (
              <>
                <UsernameField value={username} onChange={setUsername} disabled={!!busy} />
                <Txt weight="700">{uiText("Om deg")}</Txt>
                <TextInput
                  accessibilityLabel={uiText("Visningsnavn")}
                  placeholder={uiText("Visningsnavn")}
                  placeholderTextColor={c.muted}
                  value={name}
                  onChangeText={setName}
                  editable={!busy}
                  maxLength={50}
                  autoComplete="name"
                  style={input}
                />
                <TextInput
                  accessibilityLabel={uiText("Etternavn (valgfritt)")}
                  placeholder={uiText("Etternavn (valgfritt)")}
                  placeholderTextColor={c.muted}
                  value={lastName}
                  onChangeText={setLastName}
                  editable={!busy}
                  maxLength={50}
                  autoComplete="family-name"
                  autoCapitalize="words"
                  style={input}
                />
              </>
            )}
            <TextInput
              accessibilityLabel={uiText("E-post")}
              placeholder={uiText("E-post")}
              placeholderTextColor={c.muted}
              value={email}
              onChangeText={(value) => {
                setEmail(value);
              }}
              editable={!busy}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              style={input}
            />
            {mode !== "reset" && (
              <>
                <TextInput
                  accessibilityLabel={uiText("Passord")}
                  placeholder={uiText("Passord")}
                  placeholderTextColor={c.muted}
                  value={password}
                  onChangeText={setPassword}
                  editable={!busy}
                  autoCapitalize="none"
                  autoCorrect={false}
                  secureTextEntry={!visible}
                  autoComplete={register ? "new-password" : "current-password"}
                  returnKeyType={register ? "next" : "go"}
                  onSubmitEditing={register ? undefined : () => void submit()}
                  style={input}
                />
                {register && (
                  <TextInput
                    accessibilityLabel={uiText("Bekreft passord")}
                    placeholder={uiText("Gjenta passordet")}
                    placeholderTextColor={c.muted}
                    value={confirmation}
                    onChangeText={setConfirmation}
                    editable={!busy}
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={!visible}
                    autoComplete="new-password"
                    returnKeyType="go"
                    onSubmitEditing={() => void submit()}
                    style={input}
                  />
                )}
                <Pressable accessibilityRole="button" onPress={() => setVisible(!visible)} disabled={!!busy}
                  style={{ minHeight: 44, justifyContent: "center", alignSelf: "flex-end" }}>
                  <Txt weight="600">{visible ? uiText("Skjul passord") : uiText("Vis passord")}</Txt>
                </Pressable>
              </>
            )}
            {register && (
              <Txt muted size={13}>{uiText("Minst 8 tegn i passordet. Visningsnavnet er synlig for andre innloggede løpere. Etternavnet er valgfritt og privat. Økter deles bare når du selv velger det.")}</Txt>
            )}
            {!!message && (
              <View accessibilityLiveRegion="polite">
                <Txt>{message}</Txt>
              </View>
            )}
            <Button
              title={
                busy ||
                (mode === "reset"
                  ? uiText("Send tilbakestillingslenke")
                  : register
                    ? uiText("Opprett konto")
                    : uiText("Logg inn"))
              }
              disabled={!supabase || !!busy}
              onPress={() => void submit()}
            />
            {pendingEmail && mode === "login" && (
              <Button
                secondary
                title={uiText("Send bekreftelsen på nytt")}
                disabled={!!busy || !supabase}
                onPress={() =>
                  void run(uiText("Sender bekreftelse …"), async () => {
                    const { error } = await supabase!.auth.resend({
                      type: "signup",
                      email: email.trim(),
                      options: { emailRedirectTo: authRedirectUrl() },
                    });
                    if (error) throw error;
                    setMessage(
                      uiText("Hvis kontoen trenger bekreftelse, får du en ny lenke på e-post. Åpne den på denne enheten."),
                    );
                  })
                }
              />
            )}
            {mode === "login" && (
              <Button
                secondary
                title={uiText("Glemt passord?")}
                disabled={!!busy}
                onPress={() => changeMode("reset")}
              />
            )}
            <Button
              secondary
              title={
                mode === "login"
                  ? uiText("Ny her? Opprett konto")
                  : uiText("Tilbake til innlogging")
              }
              disabled={!!busy}
              onPress={() =>
                changeMode(mode === "login" ? "register" : "login")
              }
            />
          </>
        )}
        {!!message && !!session && (
          <View accessibilityLiveRegion="polite">
            <Txt>{message}</Txt>
          </View>
        )}
      </View>
      <VyroPublicLinks />
    </Page>
  );
}
