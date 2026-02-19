import {
  CreateMLCEngine,
  type MLCEngine,
  type ChatCompletionRequest,
} from '@mlc-ai/web-llm'
import { LanguageModelV1, LanguageModelV1StreamPart } from 'ai'

/**
 * WebLLMProvider - Implements Vercel AI SDK LanguageModelV1 for local inference.
 */
export class WebLLMProvider implements LanguageModelV1 {
  readonly specificationVersion = 'v1'
  readonly provider = 'web-llm'
  readonly modelId: string

  private engine: MLCEngine | null = null
  private onProgress?: (report: { progress: number; text: string }) => void

  constructor(
    modelId: string = 'Llama-3-8B-q4f16_1-MLC',
    onProgress?: (report: any) => void,
  ) {
    this.modelId = modelId
    this.onProgress = onProgress
  }

  async doGenerate(options: any): Promise<any> {
    const engine = await this.getEngine()

    const messages = options.prompt.map((p: any) => ({
      role: p.role,
      content: p.content,
    }))

    const result = await engine.chat.completions.create({
      messages,
      stream: false,
      ...options.settings,
    } as ChatCompletionRequest)

    return {
      text: result.choices[0].message.content,
      usage: result.usage,
      rawCall: { rawPrompt: options.prompt, rawSettings: options.settings },
      finishReason: result.choices[0].finish_reason || 'stop',
    }
  }

  async doStream(options: any): Promise<any> {
    const engine = await this.getEngine()

    const messages = options.prompt.map((p: any) => ({
      role: p.role,
      content: p.content,
    }))

    const asyncIterable = await engine.chat.completions.create({
      messages,
      stream: true,
      ...options.settings,
    } as ChatCompletionRequest)

    const stream = new ReadableStream<LanguageModelV1StreamPart>({
      async start(controller) {
        for await (const chunk of asyncIterable) {
          const content = chunk.choices[0]?.delta?.content
          if (content) {
            controller.enqueue({ type: 'text-delta', textDelta: content })
          }
        }
        controller.enqueue({
          type: 'finish',
          finishReason: 'stop',
          usage: { promptTokens: 0, completionTokens: 0 },
        })
        controller.close()
      },
    })

    return {
      stream,
      rawCall: { rawPrompt: options.prompt, rawSettings: options.settings },
    }
  }

  private async getEngine(): Promise<MLCEngine> {
    if (this.engine) return this.engine

    this.engine = await CreateMLCEngine(this.modelId, {
      initProgressCallback: (report) => {
        if (this.onProgress) {
          this.onProgress({ progress: report.progress, text: report.text })
        }
      },
    })

    return this.engine
  }
}

export const createWebLLM = (
  modelId?: string,
  onProgress?: (report: any) => void,
) => {
  return new WebLLMProvider(modelId, onProgress)
}
