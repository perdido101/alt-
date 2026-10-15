import { screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { SetupFrame } from '@/components/SetupFrame';
import { renderWithProviders } from './render';

describe('SetupFrame', () => {
  it('shows progress and the never-asks footer', async () => {
    await renderWithProviders(
      <SetupFrame step={4} title="Η λέξη μας" actions={<Text>action</Text>}>
        <Text>body</Text>
      </SetupFrame>,
    );
    expect(screen.getByText('Ρύθμιση μαζί · 4 από 5')).toBeTruthy();
    expect(screen.getByText('Η ΑΛΤ! δεν θα ζητήσει ποτέ κωδικούς, κάρτα ή PIN τράπεζας.')).toBeTruthy();
    expect(screen.getByRole('progressbar')).toBeTruthy();
  });
});
