import Foundation

/// The list the Call Directory Extension loads. Numbers are E.164 digits without "+", sorted ascending.
struct DirectoryEntry: Codable, Equatable {
  let number: Int64
  let label: String
}

struct DirectoryFile: Codable, Equatable {
  var block: [Int64]
  var identify: [DirectoryEntry]
}

enum DirectoryBuilder {
  static func digits(_ key: String) -> Int64? {
    guard key.hasPrefix("+") else { return nil } // short codes (112) can't be directory entries
    return Int64(key.dropFirst())
  }

  /// Builds the directory from the same cache JSON the Android screening service reads (src/lib/callShield.ts).
  /// Reported scams are labelled (and blocked when the guardian chose "Block"), official numbers are labelled,
  /// family numbers are never touched.
  static func build(fromCacheJSON json: String) throws -> DirectoryFile {
    guard let data = json.data(using: .utf8),
          let root = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
      throw NSError(domain: "CallShield", code: 1, userInfo: [NSLocalizedDescriptionKey: "invalid cache"])
    }
    let threshold = root["reportThreshold"] as? Int ?? 3
    let level = root["protectionLevel"] as? String ?? "warn"
    let strings = root["strings"] as? [String: String] ?? [:]
    let reportedLabel = "⚠️ " + (strings["reportedTitle"] ?? "Πιθανή απάτη")
    let officialTemplate = strings["officialTitle"] ?? "✓ {org}"

    var block = Set<Int64>()
    var identify = [Int64: String]()
    for r in root["reputation"] as? [[String: Any]] ?? [] {
      guard let key = r["key"] as? String, let n = digits(key), (r["approvedReports"] as? Int ?? 0) >= threshold else { continue }
      identify[n] = reportedLabel
      if level == "block" { block.insert(n) }
    }
    for o in root["official"] as? [[String: Any]] ?? [] {
      guard let key = o["key"] as? String, let n = digits(key), let org = o["organisation"] as? String else { continue }
      identify[n] = officialTemplate.replacingOccurrences(of: "{org}", with: org)
      block.remove(n)
    }
    for key in root["family"] as? [String] ?? [] {
      guard let n = digits(key) else { continue }
      identify.removeValue(forKey: n)
      block.remove(n)
    }
    return DirectoryFile(
      block: block.sorted(),
      identify: identify.keys.sorted().map { DirectoryEntry(number: $0, label: identify[$0]!) }
    )
  }
}
