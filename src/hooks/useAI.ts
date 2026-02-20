import { useContext } from 'react'
import { AIContext } from '@/contexts/AIContext'

export function useAI() {
  const context = useContext(AIContext)
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider')
  }
  return context
}
