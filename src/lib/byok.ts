import type { AIProviderContextType } from '@/contexts/AIContext'

/**
 * Builds BYOK headers ('Bring Your Own Key') for Edge Function calls (ai-assistant,
 * generate-contract-ai). Returns empty object if user hasn't configured a personal key,
 * so the edge function falls back to the global Khaos key.
 */
export function buildBYOKHeaders(
  byokSettings: AIProviderContextType['byokSettings'],
): Record<string, string> {
  if (!byokSettings?.apiKey) return {}
  return {
    'x-ai-provider': byokSettings.provider,
    'x-ai-key': byokSettings.apiKey,
    ...(byokSettings.modelName ? { 'x-ai-model': byokSettings.modelName } : {}),
  }
}
