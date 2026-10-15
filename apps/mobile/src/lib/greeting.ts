/** "Καλημέρα" until 13:00 (Greek usage), "Καλησπέρα" after. */
export function greetingKey(date: Date = new Date()): 'parent.home.greetingMorning' | 'parent.home.greetingEvening' {
  const h = date.getHours();
  return h >= 4 && h < 13 ? 'parent.home.greetingMorning' : 'parent.home.greetingEvening';
}
