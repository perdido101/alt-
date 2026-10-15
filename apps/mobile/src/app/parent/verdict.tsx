import { Redirect, router } from 'expo-router';
import { BellRing, Phone } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { BigButton } from '@/components/BigButton';
import { VerdictView } from '@/components/VerdictView';
import { useCheckStore } from '@/lib/checks';
import { callNumber, firstGuardian } from '@/lib/family';
import { useFamilyContacts } from '@/lib/queries';

/** 🔴 / 🟡 / 🟢 result of a message check. */
export default function VerdictScreen() {
  const { t } = useTranslation();
  const last = useCheckStore((s) => s.last);
  const contacts = useFamilyContacts();
  if (!last) return <Redirect href="/parent/home" />;
  const guardian = firstGuardian(contacts.data);
  const home = () => {
    useCheckStore.getState().set(null);
    router.replace('/parent/home');
  };

  if (last.verdict === 'scam') {
    return (
      <VerdictView
        verdict="scam"
        title={t('verdict.scamTitle')}
        sentence={last.reason}
        detail={last.action}
        actions={
          <>
            <BigButton
              testID="verdict-alert"
              icon={BellRing}
              variant="ember"
              size="lg"
              label={t('verdict.alertFamily')}
              onPress={() => router.push({ pathname: '/parent/alert/confirm', params: { source: 'message', checkId: last.checkId } })}
            />
            <BigButton variant="outline" label={t('verdict.deleted')} onPress={home} />
          </>
        }
      />
    );
  }
  if (last.verdict === 'caution') {
    return (
      <VerdictView
        verdict="caution"
        title={t('verdict.cautionTitle')}
        sentence={last.reason}
        detail={last.action}
        actions={
          <>
            {guardian ? (
              <BigButton icon={Phone} size="lg" label={t('verdict.askGuardian', { name: guardian.name })} onPress={() => callNumber(guardian.phone)} />
            ) : null}
            <BigButton variant="outline" label={t('verdict.ok')} onPress={home} />
          </>
        }
      />
    );
  }
  return (
    <VerdictView
      verdict="safe"
      title={t('verdict.safeTitle')}
      sentence={last.reason}
      detail={t('verdict.safeHint')}
      actions={<BigButton size="lg" label={t('verdict.thanks')} onPress={home} />}
    />
  );
}
