import CallKit
import Foundation

/// Loads the list written by the app (App Group container, callshield/directory.json).
/// Entries must be added in ascending order, which the app guarantees.
final class CallDirectoryHandler: CXCallDirectoryProvider, CXCallDirectoryExtensionContextDelegate {
  private struct Entry: Codable {
    let number: Int64
    let label: String
  }

  private struct DirectoryFile: Codable {
    let block: [Int64]
    let identify: [Entry]
  }

  override func beginRequest(with context: CXCallDirectoryExtensionContext) {
    context.delegate = self
    let file = load()
    if context.isIncremental {
      // We always ship the full list; clear what the system kept from last time.
      context.removeAllBlockingEntries()
      context.removeAllIdentificationEntries()
    }
    for number in file.block {
      context.addBlockingEntry(withNextSequentialPhoneNumber: number)
    }
    for entry in file.identify {
      context.addIdentificationEntry(withNextSequentialPhoneNumber: entry.number, label: entry.label)
    }
    context.completeRequest()
  }

  func requestFailed(for extensionContext: CXCallDirectoryExtensionContext, withError error: Error) {}

  private func load() -> DirectoryFile {
    // The extension's bundle id is "<app bundle id>.calldirectory"; the App Group is "group.<app bundle id>".
    let ext = Bundle.main.bundleIdentifier ?? ""
    let app = ext.split(separator: ".").dropLast().joined(separator: ".")
    guard
      let dir = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.\(app)"),
      let data = try? Data(contentsOf: dir.appendingPathComponent("callshield/directory.json")),
      let file = try? JSONDecoder().decode(DirectoryFile.self, from: data)
    else { return DirectoryFile(block: [], identify: []) }
    return file
  }
}
