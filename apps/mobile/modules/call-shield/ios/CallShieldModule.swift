import CallKit
import ExpoModulesCore
import UIKit

public class CallShieldModule: Module {
  private var bundleId: String { Bundle.main.bundleIdentifier ?? "gr.alt.app" }
  private var groupId: String { "group.\(bundleId)" }
  private var extensionId: String { "\(bundleId).calldirectory" }

  public func definition() -> ModuleDefinition {
    Name("CallShield")

    Function("isSupported") { true }

    /// Same input as Android: the screening cache JSON. On iOS it becomes the Call Directory list.
    Function("writeCache") { (json: String) throws in
      let file = try DirectoryBuilder.build(fromCacheJSON: json)
      guard let dir = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: self.groupId) else {
        throw NSError(domain: "CallShield", code: 2, userInfo: [NSLocalizedDescriptionKey: "app group missing"])
      }
      let folder = dir.appendingPathComponent("callshield", isDirectory: true)
      try FileManager.default.createDirectory(at: folder, withIntermediateDirectories: true)
      try JSONEncoder().encode(file).write(to: folder.appendingPathComponent("directory.json"), options: .atomic)
      CXCallDirectoryManager.sharedInstance.reloadExtension(withIdentifier: self.extensionId) { _ in }
    }

    /// "enabled" once the parent turned ΑΛΤ! on in Settings > Apps > Phone > Call Blocking & Identification.
    AsyncFunction("getDirectoryStatus") { (promise: Promise) in
      CXCallDirectoryManager.sharedInstance.getEnabledStatusForExtension(withIdentifier: self.extensionId) { status, error in
        if error != nil {
          promise.resolve("unknown")
          return
        }
        switch status {
        case .enabled: promise.resolve("enabled")
        case .disabled: promise.resolve("disabled")
        default: promise.resolve("unknown")
        }
      }
    }

    Function("openAppSettings") {
      DispatchQueue.main.async {
        if let url = URL(string: UIApplication.openSettingsURLString) { UIApplication.shared.open(url) }
      }
    }

    /// iOS can't observe calls; the parent uses "Μόλις μου τηλεφώνησαν" instead.
    Function("drainEvents") { "[]" }
  }
}
