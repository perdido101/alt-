import { Linking } from 'react-native';
import type { FamilyContact } from './api';

/** First guardian among the family numbers (for "Ρώτα τον <name>" and "Πάρε τον <name> τώρα"). */
export function firstGuardian(contacts: FamilyContact[] | undefined): FamilyContact | null {
  return contacts?.find((c) => c.isGuardian) ?? contacts?.[0] ?? null;
}

export function callNumber(phone: string) {
  void Linking.openURL(`tel:${phone}`);
}
