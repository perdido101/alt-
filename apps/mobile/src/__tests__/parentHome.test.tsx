import { fireEvent, screen } from '@testing-library/react-native';
import * as Speech from 'expo-speech';
import ParentHome from '@/app/parent/home';
import { useAppStore } from '@/lib/store';
import { renderWithProviders } from './render';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ router: { push: (...a: unknown[]) => mockPush(...a), replace: jest.fn() } }));

describe('parent home', () => {
  beforeEach(() => {
    useAppStore.setState({ displayName: 'Μαρία', locale: 'el' });
    mockPush.mockClear();
  });

  it('shows exactly the canonical home layout in Greek', async () => {
    await renderWithProviders(<ParentHome />);
    expect(screen.getByText(/^(Καλημέρα|Καλησπέρα), Μαρία$/)).toBeTruthy();
    expect(screen.getByText('Προστατεύεσαι')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Έλεγξε ένα μήνυμα. SMS, φωτογραφία ή φωνητικό' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Μόλις μου τηλεφώνησαν. Πες μου τι σου είπαν' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Κάποιος μου ζητάει λεφτά. Ειδοποιεί αμέσως την οικογένεια' })).toBeTruthy();
    expect(screen.getByText('Η λέξη μας')).toBeTruthy();
    expect(screen.getByText('Αν κάποιος λέει ότι είναι δικός σου και ζητά λεφτά, ζήτα του τη λέξη.')).toBeTruthy();
  });

  it('reads the screen aloud in Greek', async () => {
    await renderWithProviders(<ParentHome />);
    await fireEvent.press(screen.getByRole('button', { name: 'Διάβασέ το μου' }));
    expect(Speech.speak).toHaveBeenCalledWith(expect.stringContaining('Προστατεύεσαι'), expect.objectContaining({ language: 'el-GR' }));
  });

  it('keeps every parent text at 17px or more', async () => {
    const { toJSON } = await renderWithProviders(<ParentHome />);
    const sizes: number[] = [];
    const walk = (node: unknown) => {
      if (!node || typeof node !== 'object') return;
      const n = node as { type?: string; props?: { style?: unknown }; children?: unknown[] };
      if (n.type === 'Text') {
        const flat = ([] as unknown[]).concat(n.props?.style).flat(Infinity) as Array<{ fontSize?: number } | undefined>;
        const size = flat.reduce<number | undefined>((acc, s) => s?.fontSize ?? acc, undefined);
        if (size !== undefined) sizes.push(size);
      }
      (n.children ?? []).forEach(walk);
    };
    walk(toJSON());
    expect(sizes.length).toBeGreaterThan(5);
    expect(Math.min(...sizes)).toBeGreaterThanOrEqual(17);
  });

  it('renders in English too', async () => {
    useAppStore.setState({ locale: 'en' });
    await renderWithProviders(<ParentHome />, { locale: 'en' });
    expect(screen.getByText("You're protected")).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Someone is asking me for money. Alerts your family straight away' })).toBeTruthy();
  });
});
