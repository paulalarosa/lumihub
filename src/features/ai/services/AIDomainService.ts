import { Message, Canvas } from '@/stores/useAIStore'

export const AIDomainService = {
  createMessage(
    role: Message['role'],
    content: string,
    extra: Partial<Omit<Message, 'id' | 'role' | 'content' | 'timestamp'>> = {},
  ): Message {
    return {
      id: crypto.randomUUID(),
      role,
      content,
      timestamp: new Date().toISOString(),
      ...extra,
    }
  },

  createCanvas(title: string, content: string, type: Canvas['type']): Canvas {
    return {
      id: crypto.randomUUID(),
      title,
      content,
      type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  prepareCanvasUpdate(updates: Partial<Canvas>): Partial<Canvas> {
    return {
      ...updates,
      updatedAt: new Date().toISOString(),
    }
  },
}
