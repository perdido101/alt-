import { Redirect, useLocalSearchParams } from 'expo-router';

/** https://<web>/j/<token> opens the app here (App Links / Universal Links). */
export default function InviteLink() {
  const { token } = useLocalSearchParams<{ token: string }>();
  return <Redirect href={{ pathname: '/join/[token]', params: { token } }} />;
}
