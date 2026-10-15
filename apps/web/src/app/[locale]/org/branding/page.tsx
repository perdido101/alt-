import { getTranslations, setRequestLocale } from 'next-intl/server';
import { asLocale } from '@/i18n/locale';
import { env } from '@/server/env';
import { logoUrl, orgRepo } from '@/server/org';
import { uploadOrgLogo } from '../actions';

export default async function OrgBranding({ params }: { params: Promise<{ locale: string }> }) {
  const locale = asLocale((await params).locale);
  setRequestLocale(locale);
  const t = await getTranslations('org');
  const org = (await orgRepo().current())!;
  const logo = logoUrl(org.logoPath);
  return (
    <>
      <h1>{t('branding')}</h1>
      <p className="card">{org.cobranding ? t('cobrandingOn', { name: org.nameEl }) : t('cobrandingOff')}</p>
      {org.cobranding ? <p>{t('landing', { url: `${env().NEXT_PUBLIC_SITE_URL}/${locale}/d/${org.slug}` })}</p> : null}
      <form action={uploadOrgLogo} className="card stack">
        <h2>{t('logo')}</h2>
        {logo ? <img src={logo} alt={t('logo')} style={{ maxHeight: 96, width: 'auto' }} /> : null}
        <input type="file" name="logo" accept="image/png,image/jpeg,image/svg+xml,image/webp" required />
        <button className="btn btn-primary">{t('upload')}</button>
      </form>
    </>
  );
}
