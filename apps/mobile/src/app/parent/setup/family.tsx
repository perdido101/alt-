import { FamilyContactInput, normalisePhone, Relation } from '@alt/core';
import { spacing } from '@alt/tokens';
import { useQueryClient } from '@tanstack/react-query';
import { Contact } from 'expo-contacts';
import { router } from 'expo-router';
import { BookUser, Plus, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { Choice } from '@/components/Choice';
import { SetupFrame } from '@/components/SetupFrame';
import { TextField } from '@/components/TextField';
import { addFamilyContact, removeFamilyContact } from '@/lib/api';
import { errorKey } from '@/lib/errors';
import { useFamilyContacts } from '@/lib/queries';
import { useAppStore } from '@/lib/store';
import { useTheme } from '@/theme/ThemeProvider';

const RELATIONS = Relation.options;

/** Step 3: family numbers. Calls from these never show a warning; guardians get alerts; a backup gets escalation SMS. */
export default function SetupFamily() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const queryClient = useQueryClient();
  const circleId = useAppStore((s) => s.circleId);
  const contacts = useFamilyContacts();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState<Relation>('son');
  const [isGuardian, setIsGuardian] = useState(true);
  const [isBackup, setIsBackup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['familyContacts', circleId] });

  const pick = async () => {
    // The system picker hands over only the one contact chosen.
    const contact = await Contact.presentPicker();
    if (!contact) return;
    const [fullName, phones] = await Promise.all([contact.getFullName(), contact.getPhones()]);
    setName(fullName);
    const first = phones.find((p) => normalisePhone(p.number).e164) ?? phones[0];
    if (first?.number) setPhone(first.number);
  };

  const add = async () => {
    if (!circleId) return;
    setError(null);
    const parsed = FamilyContactInput.safeParse({ name, phone, relation, isGuardian, isBackup });
    if (!parsed.success) {
      setError(t(parsed.error.issues[0]?.message.startsWith('errors.') ? parsed.error.issues[0].message : 'errors.phoneInvalid'));
      return;
    }
    setBusy(true);
    try {
      await addFamilyContact(circleId, parsed.data);
      setName('');
      setPhone('');
      setIsBackup(false);
      await refresh();
    } catch (e) {
      setError(t(errorKey(e)));
    } finally {
      setBusy(false);
    }
  };

  const list = contacts.data ?? [];

  return (
    <SetupFrame
      step={3}
      title={t('setup.family.title')}
      actions={
        <BigButton
          testID="setup-continue"
          label={t('common.continue')}
          disabled={list.length === 0}
          onPress={() => {
            useAppStore.getState().completeSetupStep('family');
            router.push('/parent/setup/safe-word');
          }}
        />
      }
    >
      <AppText>{t('setup.family.body')}</AppText>

      <Card>
        {list.length === 0 ? (
          <AppText color={colors.textSoft}>{t('setup.family.empty')}</AppText>
        ) : (
          list.map((c) => (
            <View key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 56 }}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyStrong">{c.name}</AppText>
                <AppText variant="small" color={colors.textSoft}>
                  {`${t(`relations.${c.relation}`)} · ${normalisePhone(c.phone).display ?? c.phone}`}
                </AppText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${t('common.remove')} ${c.name}`}
                onPress={() => void removeFamilyContact(c.id).then(refresh)}
                style={{ minWidth: 56, minHeight: 56, alignItems: 'center', justifyContent: 'center' }}
              >
                <Trash2 color={colors.textSoft} size={26} />
              </Pressable>
            </View>
          ))
        )}
      </Card>

      <BigButton icon={BookUser} variant="outline" label={t('setup.family.pickFromContacts')} onPress={() => void pick()} />
      <AppText variant="small" color={colors.textSoft}>
        {t('setup.family.contactsPermission')}
      </AppText>

      <TextField label={t('setup.family.nameLabel')} value={name} onChangeText={setName} />
      <TextField label={t('setup.family.phoneLabel')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={error} />
      <AppText variant="bodyStrong">{t('setup.family.relationLabel')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }} accessibilityRole="radiogroup">
        {RELATIONS.map((r) => (
          <View key={r} style={{ minWidth: '47%', flexGrow: 1 }}>
            <Choice label={t(`relations.${r}`)} selected={relation === r} onPress={() => setRelation(r)} />
          </View>
        ))}
      </View>
      <Choice kind="checkbox" label={t('setup.family.isGuardian')} selected={isGuardian} onPress={() => setIsGuardian((v) => !v)} />
      <Choice kind="checkbox" label={t('setup.family.isBackup')} selected={isBackup} onPress={() => setIsBackup((v) => !v)} />
      <BigButton icon={Plus} label={t('common.add')} onPress={() => void add()} loading={busy} disabled={!name.trim() || !phone.trim()} />
    </SetupFrame>
  );
}
