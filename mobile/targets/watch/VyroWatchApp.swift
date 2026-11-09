import SwiftUI
import WatchKit

final class WorkoutDelegate: NSObject, WKExtensionDelegate {
  func handleActiveWorkoutRecovery() { DispatchQueue.main.async { WorkoutRecorder.shared.recover() } }
}

@main
struct VyroWatchApp: App {
  @WKExtensionDelegateAdaptor(WorkoutDelegate.self) var delegate
  @Environment(\.scenePhase) private var scenePhase
  var body: some Scene {
    WindowGroup { WorkoutView() }
      .onChange(of: scenePhase) { phase in
        if phase == .active { PhoneConnection.shared.sendPending() }
      }
  }
}

private struct WorkoutView: View {
  @StateObject private var recorder = WorkoutRecorder.shared
  @StateObject private var phone = PhoneConnection.shared
  @State private var sport = "Løping"
  @State private var confirmEnd = false
  private func word(_ source: String) -> String { phone.language == "en" ? watchEnglish[source] ?? source : source }
  private let lime = Color(red: 178 / 255, green: 1, blue: 120 / 255)
  var body: some View {
    NavigationStack {
      ScrollView {
        VStack(spacing: 12) {
          if recorder.phase == .idle && !recorder.recovering {
            if phone.ownerId.isEmpty {
              Image(systemName: "applewatch").font(.largeTitle).foregroundStyle(lime)
              Text(word("Koble til iPhone")).font(.headline)
              Text(word("Åpne VYRO på iPhone, logg inn og velg Innstillinger → Apple Watch.")).font(.footnote)
            } else {
              Picker(word("Aktivitet"), selection: $sport) {
                ForEach(["Løping", "Gange", "Sykling", "Fottur", "Fotball"], id: \.self) { Text(word($0)).tag($0) }
              }.pickerStyle(.navigationLink)
              Button { recorder.start(sport: sport) } label: { Label("Start", systemImage: "play.fill") }
                .tint(lime).foregroundStyle(.black).buttonStyle(.borderedProminent)
              Text(word("Utendørs · GPS")).font(.footnote).foregroundStyle(.secondary)
            }
            if phone.pending > 0 { Text(phone.language == "en" ? "Workouts waiting for iPhone: \(phone.pending)" : "\(phone.pending) økter venter på iPhone").font(.footnote) }
            Button(word("Synkroniser")) { phone.sendPending() }.font(.footnote)
            if !phone.message.isEmpty { Text(word(phone.message)).font(.footnote).foregroundStyle(.secondary) }
          } else if recorder.phase == .saving || recorder.phase == .starting || recorder.recovering {
            ProgressView(word(recorder.recovering ? "Gjenoppretter …" : recorder.phase == .saving ? "Lagrer …" : "Starter …"))
          } else {
            TimelineView(.periodic(from: .now, by: 1)) { context in
              VStack(alignment: .leading, spacing: 6) {
                Text(word(recorder.phase == .paused ? "Pauset" : recorder.sport)).font(.caption).foregroundStyle(lime)
                Text(recorder.formatTime(recorder.elapsed)).font(.system(size: 38, weight: .bold, design: .rounded)).monospacedDigit().minimumScaleFactor(0.6).lineLimit(1)
                  .accessibilityLabel(word("Tid") + " " + recorder.formatTime(recorder.elapsed))
                HStack(alignment: .firstTextBaseline) {
                  Text(String(format: "%.2f", recorder.distance / 1000)).font(.title2).bold().monospacedDigit()
                  Text("km").font(.caption).foregroundStyle(.secondary)
                  Spacer()
                }
                HStack {
                  VStack(alignment: .leading) { Text(recorder.pace).bold().monospacedDigit(); Text("min/km").font(.caption2).foregroundStyle(.secondary) }
                  Spacer()
                  VStack(alignment: .trailing) {
                    let fresh = recorder.heartRateAt.map { context.date.timeIntervalSince($0) < 30 } ?? false
                    Text(fresh ? String(format: "%.0f ♥", recorder.heartRate ?? 0) : "— ♥").bold().foregroundStyle(.red).monospacedDigit()
                    Text(word("slag/min")).font(.caption2).foregroundStyle(.secondary)
                  }
                }
              }.frame(maxWidth: .infinity, alignment: .leading)
            }
            Button { recorder.phase == .paused ? recorder.resume() : recorder.pause() } label: {
              Label(word(recorder.phase == .paused ? "Fortsett" : "Pause"), systemImage: recorder.phase == .paused ? "play.fill" : "pause.fill")
            }.tint(lime).foregroundStyle(.black).buttonStyle(.borderedProminent)
              .disabled(recorder.phase == .paused && !recorder.canResume)
            Button(word("Avslutt")) { recorder.pause(); confirmEnd = true }
            Text(word(recorder.gpsMessage)).font(.caption2).foregroundStyle(.secondary)
          }
          if !recorder.message.isEmpty { Text(word(recorder.message)).font(.footnote).foregroundStyle(.secondary) }
        }.padding(.horizontal, 4)
      }
      .navigationTitle("VYRO")
      .confirmationDialog(word("Avslutte økten?"), isPresented: $confirmEnd, titleVisibility: .visible) {
        Button(word("Lagre økt")) { recorder.finish(save: true) }
        Button(word("Forkast økt"), role: .destructive) { recorder.finish(save: false) }
        Button(word("Tilbake"), role: .cancel) {}
      }
    }
  }
}

private let watchEnglish: [String: String] = [
  "Aktivitet": "Activity",
  "Alle økter er overført.": "All workouts transferred.",
  "Avslutt": "Finish",
  "Avslutte økten?": "Finish workout?",
  "Forkast økt": "Discard workout",
  "Fortsett": "Resume",
  "Fotball": "Football",
  "Fottur": "Hiking",
  "GPS aktiv": "GPS active",
  "GPS-tilgangen er avslått. Økten er pauset.": "Location access was denied. Workout paused.",
  "Gange": "Walking",
  "Gi VYRO tilgang til posisjon før du fortsetter.": "Allow location access before resuming.",
  "Gi VYRO tilgang til posisjon i Innstillinger på klokken for å ta opp en GPS-tur.": "Allow location access in watch Settings to record a GPS workout.",
  "Gi VYRO tilgang til treningsøkter i Helse for å starte.": "Allow VYRO to access workouts in Health to start.",
  "Gjenoppretter …": "Restoring…",
  "Helse er ikke tilgjengelig på denne klokken.": "Health is unavailable on this watch.",
  "Helse kunne ikke starte opptaket. Avslutt og prøv igjen.": "Health could not start recording. Finish and try again.",
  "Ingen GPS-rute med bevegelse ennå. Fortsett turen, eller velg Forkast.": "No movement recorded yet. Continue your workout or choose Discard.",
  "Koble til iPhone": "Connect to iPhone",
  "Kontoen er endret. Prøv Start igjen.": "The account changed. Try starting again.",
  "Kontoen er endret. Økten tilhører kontoen den ble startet med.": "The account changed. This workout belongs to the account that started it.",
  "Kunne ikke lese lagrede økter. Kopiene er beholdt.": "Could not read saved workouts. Your copies are safe.",
  "Kunne ikke lese økten. Behold appen installert og prøv igjen etter omstart.": "Could not read this workout. Keep VYRO installed and try again after restarting.",
  "Kunne ikke sende øktene. Kopiene er beholdt på klokken.": "Could not transfer workouts. Copies are still on the watch.",
  "Kunne ikke starte opptaket. Sjekk tillatelser og ledig lagringsplass.": "Could not start recording. Check permissions and available storage.",
  "Lagre økt": "Save workout",
  "Lagrer …": "Saving…",
  "Lagring feilet. Økten er pauset. Frigjør plass før du fortsetter.": "Could not save. The workout is paused. Free up storage before resuming.",
  "Løping": "Running",
  "Opptaket ble avbrutt. Økten er beholdt; prøv å lagre.": "Recording was interrupted. Your workout was kept; try saving it.",
  "Opptaket er stoppet. Lagre økten eller forkast den.": "Recording stopped. Save or discard the workout.",
  "Pauset": "Paused",
  "Ruten er full. Avslutt og lagre økten.": "Route storage is full. Finish and save your workout.",
  "Starter …": "Starting…",
  "Sykling": "Cycling",
  "Synkroniser": "Sync",
  "Tid": "Time",
  "Tilbake": "Back",
  "Utendørs · GPS": "Outdoors · GPS",
  "Venter på GPS": "Waiting for GPS",
  "Venter på GPS. Distanse legges til når signalet er tilbake.": "Waiting for GPS. Distance resumes when the signal returns.",
  "slag/min": "bpm",
  "Åpne VYRO på iPhone for å fullføre synkroniseringen.": "Open VYRO on iPhone to finish syncing.",
  "Åpne VYRO på iPhone og koble til kontoen under Innstillinger → Apple Watch.": "Open VYRO on iPhone and connect your account in Settings → Apple Watch.",
  "Åpne VYRO på iPhone, logg inn og velg Innstillinger → Apple Watch.": "Open VYRO on iPhone, sign in and go to Settings → Apple Watch.",
  "Økten er forkastet.": "Workout discarded.",
  "Økten er gjenopprettet og pauset.": "Workout recovered and paused.",
  "Økten er gjenopprettet. Lagre den før du starter en ny tur.": "Workout recovered. Save it before starting another.",
  "Økten er lagret for VYRO. Apple Helse kunne ikke lagre den.": "Saved in VYRO. Apple Health could not save the workout.",
  "Økten er lagret og venter på iPhone.": "Workout saved and waiting for iPhone.",
  "Økten er lagret. Åpne VYRO på iPhone for å synkronisere.": "Workout saved. Open VYRO on iPhone to sync.",
  "Økten har nådd 24 timer. Avslutt og lagre.": "This workout reached 24 hours. Finish and save it.",
]
