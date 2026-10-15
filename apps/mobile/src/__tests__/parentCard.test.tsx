import { screen } from '@testing-library/react-native';
import { ParentCard } from '@/components/ParentCard';
import { useAppStore } from '@/lib/store';
import { renderWithProviders } from './render';

const member = { userId: 'u1', role: 'protected' as const, displayName: 'Μαρία', consentedAt: '2026-10-01T10:00:00Z', joinedAt: '2026-10-01T10:00:00Z', phone: null };

describe('ParentCard', () => {
  beforeEach(() => useAppStore.setState({ locale: 'el' }));

  it('warns when call protection was lost, with fix-it steps', async () => {
    await renderWithProviders(
      <ParentCard
        member={member}
        status={{ userId: 'u1', platform: 'android', lastSeenAt: new Date().toISOString(), lastQuiz: 'correct', health: { protecting: false, problems: ['callScreeningRole', 'overlay'], staleDays: null } }}
      />,
      { mode: 'guardian' },
    );
    expect(screen.getByText('Προστασία κλήσεων: ανενεργή')).toBeTruthy();
    expect(screen.getByText('⚠️ Η προστασία κλήσεων απενεργοποιήθηκε στο κινητό: Μαρία')).toBeTruthy();
    expect(screen.getByText(/Στη ρύθμιση «Προστασία κλήσεων»/)).toBeTruthy();
    expect(screen.getByText('Η λέξη μας: Θυμήθηκε τη λέξη σας')).toBeTruthy();
  });

  it('shows a healthy phone without warnings', async () => {
    await renderWithProviders(
      <ParentCard member={member} status={{ userId: 'u1', platform: 'android', lastSeenAt: null, lastQuiz: null, health: { protecting: true, problems: [], staleDays: null } }} />,
      { mode: 'guardian' },
    );
    expect(screen.getByText('Προστατεύεται')).toBeTruthy();
    expect(screen.getByText('Προστασία κλήσεων: ενεργή')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
