import type { MLCEngine } from '@mlc-ai/web-llm'
export class WebLLMProvider {
  readonly specificationVersion = 'v1'
  readonly provider = 'web-llm'
  readonly modelId: string

  private engine: MLCEngine | null = null
  private onProgress?: (report: { progress: number; text: string }) => void

  constructor(
    modelId: string = 'Llama-3-8B-q4f16_1-MLC',
    onProgress?: (report: { progress: number; text: string }) => void,
  ) {
    this.modelId = modelId
    this.onProgress = onProgress
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async doGenerate(options: any): Promise<any> {
    const engine = await this.getEngine()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = options.prompt.map((p: any) => ({
      role: p.role,
      content: p.content,
    }))

    const result = await engine.chat.completions.create({
      messages,
      stream: false,
      ...options.settings,
    })

    return {
      text: result.choices[0].message.content,
      usage: result.usage,
      rawCall: { rawPrompt: options.prompt, rawSettings: options.settings },
      finishReason: result.choices[0].finish_reason || 'stop',
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async doStream(options: any): Promise<any> {
    const engine = await this.getEngine()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const messages = options.prompt.map((p: any) => ({
      role: p.role,
      content: p.content,
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const asyncIterable = (await engine.chat.completions.create({
      messages,
      stream: true,
      ...options.settings,
    })) as any

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const stream = new ReadableStream<any>({
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

    const { CreateMLCEngine } = await import('@mlc-ai/web-llm')
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
  onProgress?: (report: { progress: number; text: string }) => void,
) => {
  return new WebLLMProvider(modelId, onProgress)
}
