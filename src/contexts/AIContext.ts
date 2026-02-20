import { createContext } from 'react'

export type AIProviderMode = 'cloud' | 'local'

export interface AIProviderContextType {
  mode: AIProviderMode
  setMode: (mode: AIProviderMode) => void
  byokSettings: {
    provider: string
    apiKey: string
    modelName: string
  } | null
  isLoading: boolean
  refreshSettings: () => Promise<void>
}

export const AIContext = createContext<AIProviderContextType | undefined>(
  undefined,
)
