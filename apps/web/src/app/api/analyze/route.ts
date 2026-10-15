import { CheckInputKind, MAX_TEXT_LENGTH, type AnalysisInput } from '@alt/core';
import { isLocale, type Locale } from '@alt/i18n';
import { z } from 'zod';
import { runCheck, transcription } from '@/server/analysis';
import { enforceLimit } from '@/server/rateLimit';
import { HttpError, errorResponse, membershipFor, userFromRequest } from '@/server/supabase';
import { trackServer } from '@/server/analytics';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

const JsonBody = z.object({
  kind: CheckInputKind,
  locale: z.string().optional(),
  text: z.string().max(MAX_TEXT_LENGTH).optional(),
  image: z
    .object({ mediaType: z.enum(['image/jpeg', 'image/png', 'image/webp', 'image/gif']), base64: z.string().max(Math.ceil((MAX_IMAGE_BYTES * 4) / 3)) })
    .optional(),
});

/**
 * POST /api/analyze  (Authorization: Bearer <Supabase access token>)
 *   JSON: { kind: "text"|"link"|"image"|"voice", locale, text?, image?: { mediaType, base64 } }
 *   multipart (voice note without on-device transcript): fields kind=voice, locale, audio=<file>
 * Returns { checkId, verdict, reason, action, category, suggestAlert, transcript? }.
 * Message content is never stored or logged; only the verdict is saved.
 */
export async function POST(req: Request) {
  try {
    const user = await userFromRequest(req);
    const member = await membershipFor(user.id);
    await enforceLimit('analyzeUser', user.id);
    await enforceLimit('analyzeCircle', member.circleId);

    let input: AnalysisInput;
    let locale: Locale = 'el';
    let media: { data: Uint8Array; mimeType: string } | undefined;
    let transcript: string | undefined;

    if (req.headers.get('content-type')?.startsWith('multipart/form-data')) {
      const form = await req.formData();
      const l = form.get('locale');
      if (isLocale(l)) locale = l;
      const audio = form.get('audio');
      if (!(audio instanceof Blob)) throw new HttpError(400, 'audio_missing');
      if (audio.size > MAX_AUDIO_BYTES) throw new HttpError(413, 'audio_too_large');
      const data = new Uint8Array(await audio.arrayBuffer());
      media = { data, mimeType: audio.type || 'audio/m4a' };
      try {
        transcript = await transcription().transcribe(media, locale);
      } catch {
        throw new HttpError(503, 'transcription_unavailable');
      }
      if (!transcript) throw new HttpError(422, 'nothing_heard');
      input = { kind: 'voice', text: transcript };
    } else {
      const parsed = JsonBody.safeParse(await req.json().catch(() => null));
      if (!parsed.success) {
        const tooLong = parsed.error.issues.some((i) => i.code === 'too_big');
        throw new HttpError(tooLong ? 413 : 400, tooLong ? 'input_too_long' : 'invalid_request');
      }
      const body = parsed.data;
      if (isLocale(body.locale)) locale = body.locale;
      if (!body.text?.trim() && !body.image) throw new HttpError(400, 'input_empty');
      input = { kind: body.kind, text: body.text, image: body.image };
      if (body.image) media = { data: Buffer.from(body.image.base64, 'base64'), mimeType: body.image.mediaType };
    }

    const check = await runCheck({ input, locale, circleId: member.circleId, userId: user.id, channel: 'in_app', media });
    trackServer('message_checked', {
      userId: user.id,
      optOut: req.headers.get('x-alt-analytics') === 'off',
      props: { source: input.kind, verdict: check.result.verdict, category: check.result.category },
    });
    return Response.json({ checkId: check.checkId, ...check.result, transcript });
  } catch (error) {
    return errorResponse(error);
  }
}
