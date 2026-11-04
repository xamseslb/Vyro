# Mapbox-oppsett

Fra 4. november 2026 finnes Mapbox som **valgfritt iPhone-kart**, i tillegg til web-forhåndsvisningen. Apple Maps er fortsatt standard og reserve. Bytt under Innstillinger → Kart → Kartleverandør. Android er utsatt; se [kartplattformene](map-provider-options.md).

1. Opprett konto på https://account.mapbox.com/auth/signup/ og bekreft e-posten.
2. Åpne https://account.mapbox.com/access-tokens/ . Opprett en public token kalt VYRO, med standard offentlige lesetilganger. Nøkkelen starter med pk., aldri sk.
3. Legg inn EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.… i mobile/.env.local. Behold Supabase-variablene. Filen skal ikke committes.
4. Restart Expo med `npx expo start --clear`. For lokal statisk webvisning på 8101: kjør `npm run export:web` fra mobile og last siden på nytt.
5. iPhone-alternativet bruker `@rnmapbox/maps@10.3.17` og tilhørende config-plugin. Det krever et **nytt native bygg**; Expo Go eller eldre installerte VYRO-bygg har ikke denne modulen. Legg samme offentlige miljøvariabel i det valgte EAS-miljøet før bygg. Ingen secret token skal ligge i appkode eller app.json. Apple-implementasjonen og `react-native-maps` beholdes.

En separat webnøkkel kan begrenses til websidens tillatte URL-er, inkludert faktiske utviklingsadresser. En URL-begrenset nettlesernøkkel må ikke antas å fungere i native SDK. Bruk offentlig mobilnøkkel med nødvendige lesetilganger i iPhone-bygget. Apple-alternativet krever ingen Mapbox-nøkkel. Mapbox-bruk følger kontoens kvoter/priser; ingen betalingsmetode eller betalt oppgradering er aktivert av agenten.

Standard bruker veikartet i dagslys. Satellitt og Hybrid bruker Mapbox Standard Satellite, med kartnavn/veier henholdsvis av og på. GPS-opptaket fra Henos, route/breakBefore, Supabase og private økter er uendret. Mapbox får data som er nødvendige for kartvisning. Appens ruter tegnes som lokale GeoJSON-lag, uten ruting-/map-matching-opplasting.

På iPhone er Mapbox-valget deaktivert når modul/nøkkel mangler. En gammel lagret Mapbox-preferanse uten støtte, kartfeil eller stil som ikke blir klar innen 20 sekunder viser Apple-kart med en kort forklaring. Ingen automatisk forsøksløkke. Apple kan velges permanent igjen; øktdata og opptakstilstand endres ikke. Web beholder sin eksisterende tom-/feiltilstand.

Live Activity/låseskjerm, Watch og stedssøk bruker fortsatt Apple. Mapbox deler samme Expo Location-fikser som Apple-visningen og starter ingen ekstra posisjonssensor. SDK-telemetri slås av, mens påkrevd logo/attribusjon beholdes. Rutene sendes ikke til Mapbox-ruting eller map matching. Kartfliseforespørsler røper likevel hvilket område som vises. Fotballens lokalt genererte varmekart skrives midlertidig til privat cache for native ImageSource og slettes ved lukking/bytte.

## Kontostatus 4. november 2026

Lesetest med eksisterende public token: standardstil 200, satellittstil 200, TileJSON 200, faktisk satellittbilde **429**. Brukerens konsoll viser «Usage limited» og «Add payment info to remove them». Kontobegrensningen må avklares før reelle bilder kan sammenlignes ved Triaden/Lørenskog. Ikke lov nyere bilder enn Apple uten fysisk sammenligning. Koden er forberedt lokalt; ingen signert Mapbox-testversjon er bygget eller installert ennå.

Kilder: [Tokens](https://docs.mapbox.com/help/dive-deeper/access-tokens/), [native installasjon](https://rnmapbox.github.io/docs/install), [Standard-stiler](https://docs.mapbox.com/map-styles/guides/standard-styles/), [Expo 58 FileSystem](https://docs.expo.dev/versions/v58.0.0/sdk/filesystem/).

## Satellitt og drabart rutepanel

Web og native Mapbox bruker `mapbox://styles/mapbox/standard-satellite` for begge fotografiske karttyper. Satellitt/Hybrid-bytte oppdaterer bare veier/navn og gjenbruker bildene. 2D/3D er et separat valg. Gyldig Mapbox-token med tilgang til bilder/fliser er nødvendig. Apple-alternativet bruker Apples egne karttyper.

Rutepanelet har et merket håndtak for drag eller trykk og kan minimeres for å frigjøre kartet. Kartets kameramarg tilpasses panelets synlige høyde, og kartknappene legges i en rad på lave skjermer. Se `testing.md` for lokal berørings-/WebGL-test og avgrensningen mot ekte satellittbilder og fysisk mobil. Den offentlige testlenken er ikke oppdatert fra dette miljøet.

## Diagnostiser manglende satellittbilder

Stilbeskrivelsen, kildebeskrivelsen (TileJSON) og selve bildeflisene er separate forespørsler. HTTP 200 for stilen betyr derfor ikke at fotografiene virker. Målingene som fulgte `ef3d26c`, viste 200 for beskrivelsene og **429 for bildeflisene**, også i en separat leseforespørsel. Når bildene mangler, kan ruten og noen kartlag fortsatt tegnes. Samme kartleverandør som en annen app gir ikke automatisk samme kontotilgang, kvoter eller stilvalg.

Kjør på maskinen der VYROs offentlige Mapbox-nøkkel er konfigurert, fra `mobile`:

```bash
npm run map:check
```

Skriptet bruker prosjektets ignorerte `.env.local`/Expo-miljø, gjør opptil fire lesende forespørsler og prøver **én faktisk JPEG-flis over Oslo**, uten brukerens GPS/rute. Det skriver ikke token, URL med token eller svartekster. Eventuelle tallfestede ventetider og rate-limit-headere tas med i feilsvaret. Ingen automatiske nye forsøk utføres. Det stopper ved første feil og returnerer feilkode. Det kan ikke kontrollere Mapbox-kontoens fakturering eller brukshistorikk.

For URL-begrensede webnøkler settes `VYRO_MAP_CHECK_ORIGIN` til den faktiske appadressen før kommandoen (for eksempel `http://localhost:8101`). Skriptet sender denne som Origin/Referer. Bruk riktig verdi for publisert nettsted; en localhost-test beviser ikke at den publiserte adressen er tillatt.

- `satellite-image: 200, ok: true`: én bildeflis ble levert som JPEG. Kontroller deretter fotografiene visuelt i appen og på telefonen.
- `429 / rate-limited`: vent og undersøk bruksgrenser, varsler og eventuell blokkering i den aktuelle [Mapbox-kontoen](https://account.mapbox.com/). 429 alene beviser ikke at en betaling eller oppgradering er nødvendig. Ved vedvarende 429 må kontotilgangen avklares med Mapbox; stilbytte løser ikke en avvist bildeforespørsel.
- `401/403 / access-denied`: kontroller token, offentlige lesetilganger og tillatte URL-er. Ikke erstatt brukerens nøkkel med en demo-/tredjepartsnøkkel.
- `missing-public-token`: legg prosjektets offentlige nøkkel i det lokale miljøet. Ingen nettverkskall er utført.
- `network-or-invalid-response`: kontroller nettverk/proxy. Dette er ikke bevis for en Mapbox-kontogrense.

Ved kartfeil viser appen «Prøv kartet på nytt». 429 gir 30 sekunders ventetid før ett brukerinitiert forsøk; ingen bakgrunnsløkke sender nye forespørsler. Forsøket laster kartmotoren/kildene på nytt og beholder kartutsnitt og gjeldende rute. Andre kartlag kan fortsatt velges. En vellykket stilinnlasting skjuler ikke en bildefeil. Dette retter gjenopprettingen i appen, men opphever ingen begrensning hos leverandøren.
