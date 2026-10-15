import { fireEvent, screen } from '@testing-library/react-native';
import VerdictScreen from '@/app/parent/verdict';
import { useCheckStore } from '@/lib/checks';
import { useAppStore } from '@/lib/store';
import { renderWithProviders } from './render';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), replace: jest.fn() },
  Redirect: () => null,
}));
jest.mock('@/lib/supabase', () => ({ supabase: { from: () => ({ select: () => ({ eq: () => ({ order: async () => ({ data: [], error: null }) }) }) }) } }));

const base = { checkId: '00000000-0000-4000-8000-000000000001', reason: 'Ζητούν πληρωμή με σύνδεσμο.', action: 'Μην πατήσεις τίποτα.', suggestAlert: true };

describe('verdict screens', () => {
  beforeEach(() => {
    useAppStore.setState({ locale: 'el', circleId: null });
    mockPush.mockClear();
  });

  it('red: icon + word + reason, and the family alert goes through a confirmation', async () => {
    useCheckStore.setState({ last: { ...base, verdict: 'scam', category: 'fake_courier' } });
    await renderWithProviders(<VerdictScreen />);
    expect(screen.getByRole('header', { name: 'Πολύ πιθανή απάτη' })).toBeTruthy();
    expect(screen.getByText('Ζητούν πληρωμή με σύνδεσμο.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Εντάξει, το έσβησα' })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Ειδοποίησε την οικογένεια' }));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/parent/alert/confirm', params: { source: 'message', checkId: base.checkId } });
  });

  it('amber says "Πρόσεξε"', async () => {
    useCheckStore.setState({ last: { ...base, verdict: 'caution', category: 'new_number' } });
    await renderWithProviders(<VerdictScreen />);
    expect(screen.getByRole('header', { name: 'Πρόσεξε' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Εντάξει' })).toBeTruthy();
  });

  it('green never claims more than "Μάλλον ασφαλές"', async () => {
    useCheckStore.setState({ last: { ...base, verdict: 'safe', category: 'none', suggestAlert: false } });
    await renderWithProviders(<VerdictScreen />);
    expect(screen.getByRole('header', { name: 'Μάλλον ασφαλές' })).toBeTruthy();
    expect(screen.getByText("Αν αργότερα σου ζητήσουν πληρωμή ή κωδικό, στείλ' το μου ξανά.")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Εντάξει, ευχαριστώ' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Διάβασέ το μου' })).toBeTruthy();
  });
});
