import { getTranslations } from 'next-intl/server';

/** Illustration of the incoming-call warning on the parent's phone (real copy from the app). */
export async function PhoneMock() {
  const t = await getTranslations();
  return (
    <div className="phone" role="img" aria-label={t('web.hero.phoneAlt')}>
      <div className="caller">
        <div className="num">69X XXX XXXX</div>
      </div>
      <div className="warning">
        <strong>{t('callShield.unknownTitle')}</strong>
        {t('callShield.body')}
      </div>
      <div className="actions" aria-hidden="true">
        <span className="round decline">✕</span>
        <span className="round accept">✓</span>
      </div>
    </div>
  );
}
