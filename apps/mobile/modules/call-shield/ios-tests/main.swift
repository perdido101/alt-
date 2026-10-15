// Tests for DirectoryBuilder (pure Foundation, so they run on Linux too):
//   swiftc ../ios/DirectoryBuilder.swift main.swift -o /tmp/dirtests && /tmp/dirtests
import Foundation

var failures = 0
func check(_ cond: Bool, _ name: String) {
  if cond { print("✓ \(name)") } else { print("✗ \(name)"); failures += 1 }
}

let cache = """
{
  "version": 1, "protectionLevel": "warn", "reportThreshold": 3,
  "family": ["+306912345678"],
  "official": [
    {"id": "1", "key": "+302109999999", "organisation": "Ελληνική Αστυνομία", "category": "police", "displayNumber": "210 999 9999"},
    {"id": "2", "key": "112", "organisation": "112", "category": "emergency", "displayNumber": "112"}
  ],
  "reputation": [
    {"key": "+306980000001", "approvedReports": 5, "flagged": false},
    {"key": "+306980000002", "approvedReports": 1, "flagged": true},
    {"key": "+302109999999", "approvedReports": 9, "flagged": false},
    {"key": "+306912345678", "approvedReports": 7, "flagged": false},
    {"key": "+447911123456", "approvedReports": 3, "flagged": false}
  ],
  "strings": {"reportedTitle": "Πιθανή απάτη", "officialTitle": "✓ {org} (επίσημος αριθμός)"},
  "colors": {}
}
"""

let warn = try! DirectoryBuilder.build(fromCacheJSON: cache)
let labels = Dictionary(uniqueKeysWithValues: warn.identify.map { ($0.number, $0.label) })
check(labels[306980000001] == "⚠️ Πιθανή απάτη", "reported scam is labelled")
check(labels[306980000002] == nil, "below threshold is not labelled")
check(labels[302109999999] == "✓ Ελληνική Αστυνομία (επίσημος αριθμός)", "official label wins over reports")
check(labels[306912345678] == nil, "family numbers are never labelled")
check(labels[447911123456] == "⚠️ Πιθανή απάτη", "international reported number labelled")
check(!warn.identify.contains { $0.number == 112 }, "short codes are skipped")
check(warn.block.isEmpty, "warn level blocks nothing")
check(warn.identify.map(\.number) == warn.identify.map(\.number).sorted(), "identification entries ascending")

let blocking = try! DirectoryBuilder.build(fromCacheJSON: cache.replacingOccurrences(of: "\"warn\"", with: "\"block\""))
check(blocking.block == [306980000001, 447911123456].sorted(), "block level blocks reported scams only, ascending")
check(!blocking.block.contains(302109999999), "official numbers are never blocked")
check(!blocking.block.contains(306912345678), "family numbers are never blocked")

let roundTrip = try! JSONDecoder().decode(DirectoryFile.self, from: JSONEncoder().encode(blocking))
check(roundTrip == blocking, "file format round-trips")

do {
  _ = try DirectoryBuilder.build(fromCacheJSON: "not json")
  check(false, "invalid JSON throws")
} catch {
  check(true, "invalid JSON throws")
}

if failures > 0 { print("\(failures) failed"); exit(1) }
print("all passed")
