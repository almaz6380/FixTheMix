import UIKit
import Capacitor
import AppTrackingTransparency

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    /// Merker, damit zwei Vordergrund-Wechsel kurz hintereinander nicht zwei
    /// Dialoge anfordern. Wird in der Rueckmeldung wieder geloescht: Kam kein
    /// Dialog, soll der naechste Wechsel es erneut versuchen duerfen.
    private var trackingAbfrageLaeuft = false

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = CAPBridgeViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        frageNachTracking()
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }

    // MARK: - App Tracking Transparency
    //
    //  Uebernommen aus `anigosha/ios/App/App/AppDelegate.swift`. Dort ist dieser
    //  Code durch eine Apple-Ablehnung (Richtlinie 2.1, 12.08.2026) und zehn
    //  Builds hindurchgegangen. Drei Dinge muessen ZUSAMMEN stimmen, sonst
    //  kommt dieselbe Ablehnung wieder:
    //    1. NSUserTrackingUsageDescription in der Info.plist,
    //    2. dieser Aufruf hier — nativ, nicht ueber das AdMob-Plugin,
    //    3. die Datenschutzangabe in App Store Connect auf „Tracking: ja"
    //       (nur von Hand, Rolle Admin/Account Holder).
    //
    //  Warum nativ: `AdMob.requestTrackingAuthorization()` ruft
    //  `ATTrackingManager` auf Capacitors Hintergrund-Warteschlange auf, und der
    //  Aufruf lief frueher, waehrend die App noch nicht aktiv war — in beiden
    //  Faellen zeigt iOS nichts und antwortet still mit `notDetermined`. Genau
    //  das hat der Pruefer gesehen. Hier ist beides ausgeschlossen:
    //  `sceneDidBecomeActive` heisst aktiv, `DispatchQueue.main` heisst
    //  Hauptthread. `src/lib/werbung.ts` wartet auf die Antwort, bevor es das
    //  AdMob-SDK startet — so verlangt es Google.
    //
    //  EIN UNTERSCHIED ZU ANIGOSHA, und er ist der Grund, warum dieser Code
    //  hier und nicht im AppDelegate steht: Capacitor 8 legt fuer neue Projekte
    //  einen SceneDelegate an und traegt ein `UIApplicationSceneManifest` in die
    //  Info.plist ein. Ab da ruft iOS `applicationDidBecomeActive` auf dem
    //  AppDelegate NICHT mehr auf — der Platz, an dem die Abfrage in Anigosha
    //  steht, ist hier also tot. Eine wortgetreue Uebernahme haette den Dialog
    //  nie gezeigt, ohne einen einzigen Fehler zu melden, und die Ablehnung
    //  waere erst von Apple gekommen. Anigosha hat kein Scene-Manifest (dort
    //  wurde das Projekt mit einer aelteren Capacitor-Fassung angelegt).
    private func frageNachTracking() {
        guard !trackingAbfrageLaeuft else { return }
        // Schon beantwortet (auch „abgelehnt") — iOS zeigt den Dialog dann
        // ohnehin kein zweites Mal, die Antwort aendert man in den Einstellungen.
        guard ATTrackingManager.trackingAuthorizationStatus == .notDetermined else { return }
        trackingAbfrageLaeuft = true

        // Kleiner Abstand: Beim Kaltstart kommt `sceneDidBecomeActive`, waehrend
        // das Fenster noch aufgebaut wird. Ein Dialog in genau diesem Moment hat
        // niemanden, der ihn zeigen koennte.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            guard UIApplication.shared.applicationState == .active else {
                self?.trackingAbfrageLaeuft = false
                return
            }
            ATTrackingManager.requestTrackingAuthorization { _ in
                self?.trackingAbfrageLaeuft = false
            }
        }
    }
}
