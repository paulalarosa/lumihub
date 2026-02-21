import { useState, useEffect, useCallback } from 'react'
import { ServicesService, ServiceItem } from '@/services/services.service'
import { toast } from 'sonner'
import { logger } from '@/services/logger'

export const useServices = (userId?: string) => {
  const [services, setServices] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchServices = useCallback(async () => {
    if (!userId) return // Wait for auth
    setLoading(true)
    setError(null)
    try {
      const data = await ServicesService.getAll()
      setServices(data)
    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('Unknown error')
      logger.error(error, {
        message: 'Erro ao carregar serviços.',
      })
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const removeService = async (id: string) => {
    try {
      await ServicesService.delete(id)
      setServices((prev) => prev.filter((s) => s.id !== id))
      toast.success('Serviço excluído.')
    } catch (err: unknown) {
      logger.error(err, {
        message: 'Não foi possível excluir o serviço.',
        context: { serviceId: id },
      })
      throw err
    }
  }

  return {
    services,
    loading,
    error,
    refetch: fetchServices,
    removeService,
  }
}
