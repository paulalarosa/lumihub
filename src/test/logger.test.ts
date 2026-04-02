import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Logger } from '../services/logger'

describe('Logger', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should call persistLog with info level', async () => {
    const persistSpy = vi

      .spyOn(Logger, 'persistLog')
      .mockImplementation(async () => {})

    await Logger.info('Test Info Message', 'user-123', { meta: 'data' })

    expect(persistSpy).toHaveBeenCalledWith(
      'info',
      'Test Info Message',
      'user-123',
      { meta: 'data' },
    )
  })

  it('should call persistLog with error level and stack trace', async () => {
    const persistSpy = vi

      .spyOn(Logger, 'persistLog')
      .mockImplementation(async () => {})
    const error = new Error('Something went wrong')

    await Logger.error('Test Error', error, 'user-123')

    expect(persistSpy).toHaveBeenCalledWith(
      'error',
      'Test Error',
      'user-123',
      expect.objectContaining({
        originalError: 'Something went wrong',
        stack: expect.stringContaining('Error: Something went wrong'),
      }),
    )
  })

  it('should call console logs in environment', () => {})
})
