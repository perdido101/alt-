import { formatPrice, pricing } from '@alt/core';
import { localeTags, type Locale } from '@alt/i18n';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BillingButtons } from '@/components/BillingButtons';
import { RedeemForm } from '@/components/RedeemForm';
import { guardianCircle, subscription } from '@/server/dashboard';
import { redeemCode } from '../actions';
import { asLocale } from '@/i18n/locale';

export default async function Billing({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ circle?: string; status?: string; plan?: string }> }) {
  const locale = asLocale((await params).locale);
  const sp = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const data = await guardianCircle(sp.circle);
  if (!data) return <p className="card card-calm">{t('dashboard.noCircle')}</p>;
  const sub = await subscription(data.circle.id);
  const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(localeTags[locale], { dateStyle: 'long' }) : '');
  const planName = { free: t('web.pricing.free'), family: t('web.pricing.family'), family_plus: t('web.pricing.familyPlus') }[data.circle.plan];
  const statusText = sub
    ? sub.provider !== 'stripe'
      ? t(`dashboard.managedBy_${sub.provider}` as 'dashboard.managedBy_gift')
      : t(`dashboard.status_${sub.status}` as 'dashboard.status_active', { date: date(sub.status === 'trialing' ? sub.trial_end : sub.status === 'past_due' ? sub.grace_until : sub.current_period_end) })
    : null;

  return (
    <>
      <h1>{t('dashboard.billing')}</h1>
      {sp.status === 'success' ? <p className="form-ok" role="status">{t('dashboard.checkoutSuccess')}</p> : null}
      <div className="card stack">
        <h2>{t('dashboard.plan', { plan: planName })}</h2>
        {statusText ? <p>{statusText}</p> : null}
        <BillingButtons
          circleId={data.circle.id}
          locale={locale}
          autoPlan={sp.plan}
          showPortal={!!data.circle.stripeCustomerId}
          portalLabel={t('dashboard.manage')}
          errorLabel={t('errors.generic')}
          options={
            data.circle.plan === 'free' || sub?.provider !== 'stripe'
              ? [
                  { key: 'family_monthly', label: `${t('web.pricing.family')} ${formatPrice(pricing.family.monthly, locale)}${t('web.pricing.perMonth')}` },
                  { key: 'family_yearly', label: `${t('web.pricing.family')} ${formatPrice(pricing.family.yearly, locale)}${t('web.pricing.perYear')}` },
                  { key: 'family_plus_monthly', label: `${t('web.pricing.familyPlus')} ${formatPrice(pricing.family_plus.monthly, locale)}${t('web.pricing.perMonth')}` },
                ]
              : []
          }
        />
        <p className="muted">{t('web.pricing.vat')}</p>
      </div>
      <RedeemForm
        action={redeemCode}
        circleId={data.circle.id}
        labels={{
          title: t('dashboard.redeemTitle'),
          label: t('dashboard.redeemLabel'),
          button: t('dashboard.redeem'),
          ok: t('dashboard.redeemed'),
          invalid: t('dashboard.redeemInvalid'),
          already: t('dashboard.redeemAlreadySubscribed'),
        }}
      />
    </>
  );
}
