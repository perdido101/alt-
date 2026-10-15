import Anthropic from '@anthropic-ai/sdk';
import type { AnalysisModel, ModelRequest } from '../analysis/analyze';
import { OUTPUT_SCHEMA } from '../analysis/prompt';

/** Server-only. Never import from the mobile app or client components. */
export type AnthropicModelConfig = {
  apiKey?: string;
  /** Model id from config (ANTHROPIC_MODEL). */
  model?: string;
  effort?: 'low' | 'medium' | 'high';
  timeoutMs?: number;
};

export const DEFAULT_ANALYSIS_MODEL = 'claude-opus-5-5';

type ImageMedia = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

export function createAnthropicModel(config: AnthropicModelConfig = {}): AnalysisModel {
  const client = new Anthropic({ apiKey: config.apiKey, timeout: config.timeoutMs ?? 45_000, maxRetries: 2 });
  const model = config.model ?? DEFAULT_ANALYSIS_MODEL;

  return {
    async run(request: ModelRequest) {
      const content: Anthropic.Beta.BetaContentBlockParam[] = request.content.map((c) =>
        c.type === 'text'
          ? { type: 'text', text: c.text }
          : { type: 'image', source: { type: 'base64', media_type: c.mediaType as ImageMedia, data: c.base64 } },
      );
      try {
        const response = await client.beta.messages.create({
          model,
          max_tokens: 4000,
          // If the model declines for policy reasons, the API retries on its recommended fallback model.
          betas: ['server-side-fallback-2026-07-01'],
          fallbacks: 'default',
          system: [{ type: 'text', text: request.system, cache_control: { type: 'ephemeral' } }],
          output_config: { effort: config.effort ?? 'medium', format: { type: 'json_schema', schema: OUTPUT_SCHEMA as unknown as Record<string, unknown> } },
          messages: [{ role: 'user', content }],
        });
        if (response.stop_reason === 'refusal') return { status: 'refused', detail: response.stop_details?.category ?? undefined };
        if (response.stop_reason === 'max_tokens') return { status: 'error', detail: 'max_tokens' };
        const text = response.content.find((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')?.text;
        if (!text) return { status: 'error', detail: 'no_text' };
        try {
          return { status: 'ok', output: JSON.parse(text) as unknown };
        } catch {
          return { status: 'error', detail: 'invalid_json' };
        }
      } catch (error) {
        if (error instanceof Anthropic.RateLimitError) return { status: 'error', detail: 'rate_limited' };
        if (error instanceof Anthropic.APIError) return { status: 'error', detail: `api_${error.status ?? 'unknown'}` };
        return { status: 'error', detail: 'network' };
      }
    },
  };
}
