import 'server-only';
import { env } from '../env';

export type SmsResult = { ok: boolean; ref?: string; error?: string };

/** SMS for alert escalation and invites. Twilio in production (alphanumeric sender "ALT"); console in development. */
export interface SmsProvider {
  send(to: string, text: string): Promise<SmsResult>;
}

const consoleSms: SmsProvider = {
  async send(to, text) {
    console.info(`[sms] to=${to.slice(0, 5)}… len=${text.length}`);
    return { ok: true, ref: 'console' };
  },
};

const twilioSms: SmsProvider = {
  async send(to, text) {
    const e = env();
    if (!e.TWILIO_ACCOUNT_SID || !e.TWILIO_AUTH_TOKEN) return { ok: false, error: 'not_configured' };
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${e.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${e.TWILIO_ACCOUNT_SID}:${e.TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: to, From: e.SMS_SENDER_ID, Body: text }),
    });
    const json = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
    return res.ok ? { ok: true, ref: json.sid } : { ok: false, error: json.message ?? `http_${res.status}` };
  },
};

export function smsProvider(): SmsProvider {
  return env().SMS_PROVIDER === 'twilio' ? twilioSms : consoleSms;
}
